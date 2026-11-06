import { Check, Copy } from "lucide-react";
import { useClipboard } from "../hooks/useClipboard";
import { useToast } from "./ToastProvider";

interface TerminalBlockProps {
  command: string;
  label?: string;
  compact?: boolean;
  showHeader?: boolean;
}

function highlightLine(line: string) {
  const firstWord = line.match(/^\s*([^\s]+)/)?.[1];
  return line.split(/(\s+)/).map((part, index) => {
    if (/^\s+$/.test(part)) return part;
    let className = "syntax-default";
    if (part.startsWith("#")) className = "syntax-comment";
    else if (part.startsWith("https://") || part.startsWith("http://")) className = "syntax-url";
    else if (part.startsWith("--")) className = "syntax-flag";
    else if (part === "sudo" || part === firstWord) className = "syntax-command";
    return <span className={className} key={`${index}-${part}`}>{part}</span>;
  });
}

export function TerminalBlock({ command, label = "BASH", compact = false, showHeader = true }: TerminalBlockProps) {
  const { copied, copy } = useClipboard();
  const { showToast } = useToast();

  const handleCopy = async () => {
    const success = await copy(command);
    showToast(success ? "Command copied to clipboard" : "Clipboard access is unavailable", success ? "success" : "error");
  };

  return (
    <div className={`terminal-block${compact ? " terminal-block-compact" : ""}`}>
      {showHeader && (
        <div className="terminal-block-header">
          <span className="terminal-language">{label}</span>
          <button className={`copy-button${copied ? " is-copied" : ""}`} onClick={handleCopy} aria-label={copied ? "Command copied" : "Copy command"}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      )}
      <pre className="terminal-code" aria-label="Terminal command">
        <code>
          {command.split(/\r?\n/).map((line, index) => (
            <span className="terminal-line" key={`${index}-${line}`}>
              <span className="terminal-prompt" aria-hidden="true">$</span>
              <span className="terminal-line-content">{line.length ? highlightLine(line) : " "}</span>
            </span>
          ))}
        </code>
      </pre>
      {!showHeader && (
        <button className={`terminal-inline-copy${copied ? " is-copied" : ""}`} onClick={handleCopy} aria-label={copied ? "Command copied" : "Copy command"}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          <span>{copied ? "Copied" : "Copy command"}</span>
        </button>
      )}
    </div>
  );
}