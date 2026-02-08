#!/usr/bin/env python3
"""
Print Kiosk Pro - Linux Edition
Complete printing solution for Linux with CUPS integration
"""

import os
import sys
import sqlite3
import json
import uuid
import logging
import subprocess
import threading
import queue
import time
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from contextlib import contextmanager
from pathlib import Path

# Flask imports
from flask import Flask, request, jsonify, render_template, session, redirect, url_for, send_file
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import qrcode
from PIL import Image
import bcrypt
import secrets

# ============================================================================
# SETUP AND CONFIGURATION
# ============================================================================
app = Flask(__name__)
app.config.update(
    SECRET_KEY=secrets.token_hex(32),
    MAX_CONTENT_LENGTH=100 * 1024 * 1024,  # 100MB
    UPLOAD_FOLDER=os.path.expanduser('~/printkiosk/uploads'),
    DATABASE=os.path.expanduser('~/printkiosk/database.db'),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax'
)

CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
job_queue = queue.Queue()

# Create directories
Path(app.config['UPLOAD_FOLDER']).mkdir(parents=True, exist_ok=True)
Path('~/printkiosk/qrcodes').expanduser().mkdir(parents=True, exist_ok=True)

# ============================================================================
# DATABASE
# ============================================================================
def init_db():
    """Initialize database"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Kiosks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS kiosks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                printer_name TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                qr_code TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Print jobs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS print_jobs (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                status TEXT DEFAULT 'pending',
                kiosk_id TEXT NOT NULL,
                user_id INTEGER,
                copies INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (kiosk_id) REFERENCES kiosks (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        
        # Create admin user if not exists
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
        if cursor.fetchone()[0] == 0:
            password_hash = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode()
            cursor.execute('''
                INSERT INTO users (username, password_hash, role)
                VALUES (?, ?, ?)
            ''', ('admin', password_hash, 'admin'))
            conn.commit()

@contextmanager
def get_db():
    """Database connection context manager"""
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# ============================================================================
# AUTHENTICATION
# ============================================================================
def login_required(f):
    """Decorator for requiring login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# ============================================================================
# PRINTER MANAGEMENT
# ============================================================================
class PrinterManager:
    """Manage printers using CUPS"""
    
    @staticmethod
    def get_printers():
        """Get all printers"""
        try:
            result = subprocess.run(['lpstat', '-p'], capture_output=True, text=True, timeout=10)
            printers = []
            
            for line in result.stdout.split('\n'):
                if line.startswith('printer'):
                    parts = line.split()
                    if len(parts) >= 2:
                        printer_name = parts[1]
                        status = ' '.join(parts[3:]) if len(parts) > 3 else 'unknown'
                        printers.append({
                            'name': printer_name,
                            'status': status,
                            'is_online': 'enabled' in status
                        })
            
            return printers
        except Exception as e:
            print(f"Error getting printers: {e}")
            return []
    
    @staticmethod
    def print_file(filepath, printer_name, copies=1):
        """Print a file"""
        try:
            cmd = ['lp', '-d', printer_name, '-n', str(copies), filepath]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                # Extract job ID from output
                job_id = None
                for line in result.stdout.split('\n'):
                    if 'request id is' in line:
                        job_id = line.split()[-1]
                        break
                return True, "Print job submitted", job_id
            else:
                return False, result.stderr, None
        except Exception as e:
            return False, str(e), None

# ============================================================================
# BACKGROUND WORKER
# ============================================================================
class BackgroundWorker(threading.Thread):
    """Process print jobs in background"""
    
    def __init__(self):
        super().__init__(daemon=True)
        self.running = True
    
    def run(self):
        """Process jobs from queue"""
        while self.running:
            try:
                job_id = job_queue.get(timeout=1)
                self.process_job(job_id)
                job_queue.task_done()
            except:
                time.sleep(0.1)
    
    def process_job(self, job_id):
        """Process a single print job"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM print_jobs WHERE id = ?", (job_id,))
            job = cursor.fetchone()
            
            if not job or job['status'] != 'approved':
                return
            
            try:
                # Get kiosk info
                cursor.execute("SELECT printer_name FROM kiosks WHERE id = ?", (job['kiosk_id'],))
                kiosk = cursor.fetchone()
                
                if kiosk:
                    # Print the file
                    success, message, _ = PrinterManager.print_file(
                        job['file_path'],
                        kiosk['printer_name'],
                        job['copies']
                    )
                    
                    if success:
                        cursor.execute(
                            "UPDATE print_jobs SET status = 'completed', printed_at = CURRENT_TIMESTAMP WHERE id = ?",
                            (job_id,)
                        )
                        socketio.emit('job_completed', {'job_id': job_id})
                    else:
                        cursor.execute(
                            "UPDATE print_jobs SET status = 'failed', error_message = ? WHERE id = ?",
                            (message, job_id)
                        )
                        socketio.emit('job_failed', {'job_id': job_id, 'error': message})
                    
                    conn.commit()
            
            except Exception as e:
                print(f"Error processing job {job_id}: {e}")

# ============================================================================
# ROUTES
# ============================================================================
@app.route('/')
def index():
    """Home page"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Kiosk Pro</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="bg-light">
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card shadow">
                            <div class="card-body text-center">
                                <h1 class="mb-4">Print Kiosk Pro</h1>
                                <p class="text-muted mb-4">Advanced printing solution for Linux</p>
                                <div class="d-grid gap-2">
                                    <a href="/login" class="btn btn-primary btn-lg">Login</a>
                                    <a href="/register" class="btn btn-outline-secondary btn-lg">Register</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    ''')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, password_hash FROM users WHERE username = ?", (username,))
            user = cursor.fetchone()
            
            if user and bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
                session['user_id'] = user['id']
                session['username'] = username
                return redirect(url_for('dashboard'))
        
        return render_template_string('''
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="bg-light">
                <div class="container mt-5">
                    <div class="row justify-content-center">
                        <div class="col-md-4">
                            <div class="card shadow">
                                <div class="card-body">
                                    <h2 class="text-center mb-4">Login</h2>
                                    <div class="alert alert-danger">Invalid credentials</div>
                                    <form method="POST">
                                        <div class="mb-3">
                                            <label class="form-label">Username</label>
                                            <input type="text" name="username" class="form-control" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Password</label>
                                            <input type="password" name="password" class="form-control" required>
                                        </div>
                                        <button type="submit" class="btn btn-primary w-100">Login</button>
                                    </form>
                                    <div class="text-center mt-3">
                                        <a href="/register">Create account</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        ''')
    
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="bg-light">
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-4">
                        <div class="card shadow">
                            <div class="card-body">
                                <h2 class="text-center mb-4">Login</h2>
                                <form method="POST">
                                    <div class="mb-3">
                                        <label class="form-label">Username</label>
                                        <input type="text" name="username" class="form-control" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Password</label>
                                        <input type="password" name="password" class="form-control" required>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Login</button>
                                </form>
                                <div class="text-center mt-3">
                                    <a href="/register">Create account</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    ''')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Register page"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cursor.fetchone():
                return "Username already exists", 400
            
            # Create user
            password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            cursor.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                (username, password_hash)
            )
            conn.commit()
            
            return redirect(url_for('login'))
    
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Register</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="bg-light">
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-4">
                        <div class="card shadow">
                            <div class="card-body">
                                <h2 class="text-center mb-4">Register</h2>
                                <form method="POST">
                                    <div class="mb-3">
                                        <label class="form-label">Username</label>
                                        <input type="text" name="username" class="form-control" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Password</label>
                                        <input type="password" name="password" class="form-control" required>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Register</button>
                                </form>
                                <div class="text-center mt-3">
                                    <a href="/login">Already have an account?</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    ''')

@app.route('/dashboard')
@login_required
def dashboard():
    """Dashboard page"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get user's kiosks
        cursor.execute(
            "SELECT * FROM kiosks WHERE user_id = ? ORDER BY created_at DESC",
            (session['user_id'],)
        )
        kiosks = cursor.fetchall()
        
        # Get recent jobs
        cursor.execute('''
            SELECT pj.*, k.name as kiosk_name 
            FROM print_jobs pj 
            JOIN kiosks k ON pj.kiosk_id = k.id 
            WHERE k.user_id = ? 
            ORDER BY pj.created_at DESC 
            LIMIT 10
        ''', (session['user_id'],))
        jobs = cursor.fetchall()
    
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dashboard</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css" rel="stylesheet">
        </head>
        <body>
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container">
                    <a class="navbar-brand" href="/dashboard">Print Kiosk Pro</a>
                    <div class="navbar-nav ms-auto">
                        <span class="navbar-text me-3">Hello, {{ session.username }}</span>
                        <a class="nav-link" href="/kiosks">Kiosks</a>
                        <a class="nav-link" href="/logout">Logout</a>
                    </div>
                </div>
            </nav>
            
            <div class="container mt-4">
                <div class="row">
                    <div class="col-md-8">
                        <h3>Recent Print Jobs</h3>
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>File</th>
                                        <th>Kiosk</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {% for job in jobs %}
                                    <tr>
                                        <td>{{ job.id[:8] }}...</td>
                                        <td>{{ job.filename }}</td>
                                        <td>{{ job.kiosk_name }}</td>
                                        <td>
                                            {% if job.status == 'pending' %}
                                            <span class="badge bg-warning">Pending</span>
                                            {% elif job.status == 'completed' %}
                                            <span class="badge bg-success">Completed</span>
                                            {% elif job.status == 'failed' %}
                                            <span class="badge bg-danger">Failed</span>
                                            {% else %}
                                            <span class="badge bg-secondary">{{ job.status }}</span>
                                            {% endif %}
                                        </td>
                                        <td>{{ job.created_at }}</td>
                                    </tr>
                                    {% endfor %}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Quick Actions</h5>
                                <a href="/kiosks/new" class="btn btn-primary w-100 mb-2">
                                    <i class="bi bi-plus-circle"></i> Create Kiosk
                                </a>
                                <a href="/jobs" class="btn btn-secondary w-100 mb-2">
                                    <i class="bi bi-printer"></i> View All Jobs
                                </a>
                                <a href="/printers" class="btn btn-info w-100">
                                    <i class="bi bi-hdd-stack"></i> Manage Printers
                                </a>
                            </div>
                        </div>
                        
                        <div class="card mt-3">
                            <div class="card-body">
                                <h5 class="card-title">Your Kiosks</h5>
                                <ul class="list-group">
                                    {% for kiosk in kiosks %}
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        {{ kiosk.name }}
                                        <a href="/kiosk/{{ kiosk.id }}" class="btn btn-sm btn-outline-primary">View</a>
                                    </li>
                                    {% endfor %}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>
    ''', session=session, jobs=jobs, kiosks=kiosks)

@app.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    return redirect(url_for('index'))

@app.route('/kiosks')
@login_required
def list_kiosks():
    """List all kiosks"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM kiosks WHERE user_id = ? ORDER BY created_at DESC",
            (session['user_id'],)
        )
        kiosks = cursor.fetchall()
    
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>My Kiosks</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container">
                    <a class="navbar-brand" href="/dashboard">Print Kiosk Pro</a>
                </div>
            </nav>
            
            <div class="container mt-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>My Kiosks</h2>
                    <a href="/kiosks/new" class="btn btn-primary">Create New Kiosk</a>
                </div>
                
                <div class="row">
                    {% for kiosk in kiosks %}
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">{{ kiosk.name }}</h5>
                                <p class="card-text">{{ kiosk.description or 'No description' }}</p>
                                <p class="card-text"><small>Printer: {{ kiosk.printer_name }}</small></p>
                                <div class="d-flex gap-2">
                                    <a href="/kiosk/{{ kiosk.id }}" class="btn btn-sm btn-primary">View</a>
                                    <a href="/kiosk/{{ kiosk.id }}/qr" class="btn btn-sm btn-secondary">QR Code</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    {% endfor %}
                </div>
            </div>
        </body>
        </html>
    ''', kiosks=kiosks)

@app.route('/kiosks/new', methods=['GET', 'POST'])
@login_required
def create_kiosk():
    """Create new kiosk"""
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        printer_name = request.form.get('printer_name')
        
        # Get available printers
        printers = PrinterManager.get_printers()
        printer_exists = any(p['name'] == printer_name for p in printers)
        
        if not printer_exists:
            return "Printer not found", 400
        
        kiosk_id = str(uuid.uuid4())[:8]
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(f"{request.host_url}kiosk/{kiosk_id}")
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        qr_path = f"~/printkiosk/qrcodes/{kiosk_id}.png"
        img.save(Path(qr_path).expanduser())
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO kiosks (id, name, description, printer_name, user_id, qr_code)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (kiosk_id, name, description, printer_name, session['user_id'], qr_path))
            conn.commit()
        
        return redirect(url_for('list_kiosks'))
    
    # GET request - show form
    printers = PrinterManager.get_printers()
    
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Create Kiosk</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container">
                    <a class="navbar-brand" href="/dashboard">Print Kiosk Pro</a>
                </div>
            </nav>
            
            <div class="container mt-4">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h2 class="text-center mb-4">Create New Kiosk</h2>
                                <form method="POST">
                                    <div class="mb-3">
                                        <label class="form-label">Kiosk Name</label>
                                        <input type="text" name="name" class="form-control" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Description</label>
                                        <textarea name="description" class="form-control" rows="3"></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Printer</label>
                                        <select name="printer_name" class="form-select" required>
                                            <option value="">Select a printer</option>
                                            {% for printer in printers %}
                                            <option value="{{ printer.name }}">{{ printer.name }} - {{ printer.status }}</option>
                                            {% endfor %}
                                        </select>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Create Kiosk</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    ''', printers=printers)

@app.route('/kiosk/<kiosk_id>')
def kiosk_page(kiosk_id):
    """Public kiosk upload page"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM kiosks WHERE id = ?", (kiosk_id,))
        kiosk = cursor.fetchone()
        
        if not kiosk:
            return "Kiosk not found", 404
    
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>{{ kiosk.name }} - Print Kiosk</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                .upload-area {
                    border: 2px dashed #ccc;
                    border-radius: 10px;
                    padding: 40px;
                    text-align: center;
                    cursor: pointer;
                    transition: border-color 0.3s;
                }
                .upload-area:hover {
                    border-color: #0d6efd;
                }
            </style>
        </head>
        <body>
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body text-center">
                                <h1 class="mb-3">{{ kiosk.name }}</h1>
                                {% if kiosk.description %}
                                <p class="text-muted mb-4">{{ kiosk.description }}</p>
                                {% endif %}
                                
                                <div id="uploadArea" class="upload-area mb-4" onclick="document.getElementById('fileInput').click()">
                                    <i class="bi bi-cloud-arrow-up fs-1 mb-3"></i>
                                    <h4>Click to upload file</h4>
                                    <p class="text-muted">or drag and drop</p>
                                    <input type="file" id="fileInput" class="d-none" onchange="handleFileSelect(event)">
                                </div>
                                
                                <div id="fileInfo" class="d-none mb-3">
                                    <div class="alert alert-info">
                                        <strong>Selected file:</strong> <span id="fileName"></span>
                                        <button class="btn btn-sm btn-outline-danger float-end" onclick="clearFile()">×</button>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Copies</label>
                                    <input type="number" id="copies" class="form-control" value="1" min="1" max="10">
                                </div>
                                
                                <button id="uploadBtn" class="btn btn-primary w-100" disabled onclick="uploadFile()">
                                    Upload & Print
                                </button>
                                
                                <div id="uploadResult" class="mt-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                let selectedFile = null;
                
                function handleFileSelect(event) {
                    selectedFile = event.target.files[0];
                    document.getElementById('fileName').textContent = selectedFile.name;
                    document.getElementById('fileInfo').classList.remove('d-none');
                    document.getElementById('uploadBtn').disabled = false;
                }
                
                function clearFile() {
                    selectedFile = null;
                    document.getElementById('fileInput').value = '';
                    document.getElementById('fileInfo').classList.add('d-none');
                    document.getElementById('uploadBtn').disabled = true;
                }
                
                async function uploadFile() {
                    if (!selectedFile) return;
                    
                    const formData = new FormData();
                    formData.append('file', selectedFile);
                    formData.append('copies', document.getElementById('copies').value);
                    
                    const btn = document.getElementById('uploadBtn');
                    btn.disabled = true;
                    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Uploading...';
                    
                    try {
                        const response = await fetch('/api/kiosk/{{ kiosk.id }}/upload', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            document.getElementById('uploadResult').innerHTML = `
                                <div class="alert alert-success">
                                    File uploaded successfully! Job ID: ${result.job_id}
                                </div>
                            `;
                            clearFile();
                        } else {
                            document.getElementById('uploadResult').innerHTML = `
                                <div class="alert alert-danger">
                                    Upload failed: ${result.error}
                                </div>
                            `;
                        }
                    } catch (error) {
                        document.getElementById('uploadResult').innerHTML = `
                            <div class="alert alert-danger">
                                Network error: ${error}
                            </div>
                        `;
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = 'Upload & Print';
                    }
                }
                
                // Drag and drop support
                const uploadArea = document.getElementById('uploadArea');
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    uploadArea.addEventListener(eventName, preventDefaults, false);
                });
                
                function preventDefaults(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                ['dragenter', 'dragover'].forEach(eventName => {
                    uploadArea.addEventListener(eventName, () => {
                        uploadArea.style.borderColor = '#0d6efd';
                    }, false);
                });
                
                ['dragleave', 'drop'].forEach(eventName => {
                    uploadArea.addEventListener(eventName, () => {
                        uploadArea.style.borderColor = '#ccc';
                    }, false);
                });
                
                uploadArea.addEventListener('drop', (e) => {
                    const files = e.dataTransfer.files;
                    if (files.length) {
                        selectedFile = files[0];
                        document.getElementById('fileName').textContent = selectedFile.name;
                        document.getElementById('fileInfo').classList.remove('d-none');
                        document.getElementById('uploadBtn').disabled = false;
                    }
                });
            </script>
        </body>
        </html>
    ''', kiosk=kiosk)

@app.route('/api/kiosk/<kiosk_id>/upload', methods=['POST'])
def api_upload(kiosk_id):
    """API endpoint for file upload"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    copies = int(request.form.get('copies', 1))
    
    # Save file
    job_id = str(uuid.uuid4())[:12]
    filename = f"{job_id}_{file.filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    file_size = os.path.getsize(filepath)
    
    # Create job record
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO print_jobs (id, filename, file_path, file_size, kiosk_id, copies, status)
            VALUES (?, ?, ?, ?, ?, ?, 'approved')
        ''', (job_id, file.filename, filepath, file_size, kiosk_id, copies))
        conn.commit()
    
    # Add to print queue
    job_queue.put(job_id)
    
    return jsonify({'success': True, 'job_id': job_id})

@app.route('/kiosk/<kiosk_id>/qr')
def kiosk_qr(kiosk_id):
    """Display QR code for kiosk"""
    qr_path = Path(f"~/printkiosk/qrcodes/{kiosk_id}.png").expanduser()
    
    if not qr_path.exists():
        return "QR code not found", 404
    
    return send_file(qr_path)

@app.route('/jobs')
@login_required
def list_jobs():
    """List all print jobs"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT pj.*, k.name as kiosk_name 
            FROM print_jobs pj 
            JOIN kiosks k ON pj.kiosk_id = k.id 
            WHERE k.user_id = ? 
            ORDER BY pj.created_at DESC
        ''', (session['user_id'],))
        jobs = cursor.fetchall()
    
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Jobs</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container">
                    <a class="navbar-brand" href="/dashboard">Print Kiosk Pro</a>
                </div>
            </nav>
            
            <div class="container mt-4">
                <h2>Print Jobs</h2>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>File</th>
                                <th>Kiosk</th>
                                <th>Copies</th>
                                <th>Status</th>
                                <th>Size</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for job in jobs %}
                            <tr>
                                <td>{{ job.id[:8] }}...</td>
                                <td>{{ job.filename }}</td>
                                <td>{{ job.kiosk_name }}</td>
                                <td>{{ job.copies }}</td>
                                <td>
                                    {% if job.status == 'pending' %}
                                    <span class="badge bg-warning">Pending</span>
                                    {% elif job.status == 'completed' %}
                                    <span class="badge bg-success">Completed</span>
                                    {% elif job.status == 'failed' %}
                                    <span class="badge bg-danger">Failed</span>
                                    {% else %}
                                    <span class="badge bg-secondary">{{ job.status }}</span>
                                    {% endif %}
                                </td>
                                <td>
                                    {% if job.file_size %}
                                    {{ (job.file_size / 1024) | round(1) }} KB
                                    {% endif %}
                                </td>
                                <td>{{ job.created_at }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
    ''', jobs=jobs)

@app.route('/printers')
@login_required
def list_printers():
    """List available printers"""
    printers = PrinterManager.get_printers()
    
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Printers</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container">
                    <a class="navbar-brand" href="/dashboard">Print Kiosk Pro</a>
                </div>
            </nav>
            
            <div class="container mt-4">
                <h2>Available Printers</h2>
                <button class="btn btn-primary mb-3" onclick="refreshPrinters()">Refresh</button>
                <div class="row">
                    {% for printer in printers %}
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">{{ printer.name }}</h5>
                                <p class="card-text">
                                    Status: 
                                    {% if printer.is_online %}
                                    <span class="badge bg-success">Online</span>
                                    {% else %}
                                    <span class="badge bg-danger">Offline</span>
                                    {% endif %}
                                </p>
                                <p class="card-text"><small>{{ printer.status }}</small></p>
                            </div>
                        </div>
                    </div>
                    {% endfor %}
                </div>
            </div>
            
            <script>
                function refreshPrinters() {
                    window.location.reload();
                }
            </script>
        </body>
        </html>
    ''', printers=printers)

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'queue_size': job_queue.qsize()
    })

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================
def render_template_string(template, **context):
    """Simple template rendering"""
    from jinja2 import Template
    return Template(template).render(**context)

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================
if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Start background worker
    worker = BackgroundWorker()
    worker.start()
    
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║           PRINTKIOSK PRO - LINUX EDITION                ║
    ╠══════════════════════════════════════════════════════════╣
    ║                                                          ║
    ║  🌐 Web Interface: http://localhost:5000                 ║
    ║                                                          ║
    ║  👤 Admin Login:                                         ║
    ║     Username: admin                                      ║
    ║     Password: admin123                                   ║
    ║                                                          ║
    ║  📁 Uploads: ~/printkiosk/uploads                        ║
    ║  💾 Database: ~/printkiosk/database.db                  ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    # Start the application
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
