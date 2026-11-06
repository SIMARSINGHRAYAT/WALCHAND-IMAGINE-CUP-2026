export interface InstallStep {
  title: string;
  description: string;
  command: string;
  note?: string;
}

export interface TroubleshootingNote {
  title: string;
  body: string;
  command?: string;
}

export interface BrowserGuide {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  logo: string;
  color: string;
  officialUrl: string;
  documentationUrl: string;
  documentationLabel: string;
  supportedDebian: string;
  architectures: string;
  installMethod: string;
  methodFilter: "Debian archive" | "Vendor repository" | "Official .deb";
  lastVerified: string;
  searchTerms: string[];
  steps: InstallStep[];
  launchCommand: string;
  verifyCommand: string;
  uninstallCommand: string;
  caution?: string;
  troubleshooting: TroubleshootingNote[];
}

export const browsers: BrowserGuide[] = [
  {
    slug: "chrome",
    name: "Google Chrome",
    shortName: "Chrome",
    description: "Google's fast, proprietary browser with built-in sync and a large extension library.",
    logo: "googlechrome",
    color: "#4285f4",
    officialUrl: "https://www.google.com/chrome/",
    documentationUrl: "https://support.google.com/chrome/answer/95346?hl=en",
    documentationLabel: "Google Chrome Linux installation",
    supportedDebian: "Debian 10 or newer",
    architectures: "amd64 and arm64 (64-bit)",
    installMethod: "Google-hosted Debian package",
    methodFilter: "Official .deb",
    lastVerified: "2026-11-06",
    searchTerms: ["chrome", "google", "browser", "install chrome on debian", "apt"],
    steps: [
      {
        title: "Check your system architecture",
        description: "Google publishes separate 64-bit Debian packages for Intel / AMD and ARM systems. Confirm the architecture before downloading.",
        command: "dpkg --print-architecture",
        note: "Continue only if the output is amd64 or arm64. This guide does not cover 32-bit or other architectures.",
      },
      {
        title: "Refresh APT and install wget",
        description: "Update Debian's package metadata and make sure the command-line downloader is available.",
        command: "sudo apt update\nsudo apt install wget",
      },
      {
        title: "Download the package for your architecture",
        description: "Choose Google's stable amd64 or arm64 .deb based on the architecture printed in step one. The package is fetched directly from Google's Linux host.",
        command: "case \"$(dpkg --print-architecture)\" in\n  amd64) package=google-chrome-stable_current_amd64.deb ;;\n  arm64) package=google-chrome-stable_current_arm64.deb ;;\n  *) printf 'Unsupported architecture: %s\\n' \"$(dpkg --print-architecture)\" >&2; exit 1 ;;\nesac\nwget \"https://dl.google.com/linux/direct/$package\"",
      },
      {
        title: "Install the local package with APT",
        description: "Run this from the directory containing the downloaded file. APT resolves package dependencies for you.",
        command: "sudo apt install \"./google-chrome-stable_current_$(dpkg --print-architecture).deb\"",
      },
      {
        title: "Launch Chrome",
        description: "Open the browser from a terminal, or find Google Chrome in your desktop application menu.",
        command: "google-chrome",
      },
      {
        title: "Verify the installed version",
        description: "Print the installed browser version to confirm the command is available.",
        command: "google-chrome --version",
      },
    ],
    launchCommand: "google-chrome",
    verifyCommand: "google-chrome --version",
    uninstallCommand: "sudo apt remove google-chrome-stable",
    caution: "Google Chrome is proprietary software. Use the official package that matches amd64 or arm64; use Chromium from Debian's archive on other architectures.",
    troubleshooting: [
      {
        title: "APT cannot find the downloaded file",
        body: "Run the install command from the folder where wget saved the package, or use an absolute path to the file.",
        command: "ls -lh \"google-chrome-stable_current_$(dpkg --print-architecture).deb\"",
      },
      {
        title: "The package reports an architecture mismatch",
        body: "Google publishes Debian packages for amd64 and arm64. Check your Debian architecture and do not force installation on an unsupported CPU.",
        command: "dpkg --print-architecture",
      },
    ],
  },
  {
    slug: "edge",
    name: "Microsoft Edge",
    shortName: "Edge",
    description: "A Chromium-based browser from Microsoft with built-in productivity and security features.",
    logo: "microsoftedge",
    color: "#20a5f8",
    officialUrl: "https://www.microsoft.com/en-us/edge/download?platform=linux",
    documentationUrl: "https://learn.microsoft.com/en-us/linux/packages",
    documentationLabel: "Microsoft Linux package guidance",
    supportedDebian: "Debian 10 or newer",
    architectures: "amd64 (64-bit Intel / AMD)",
    installMethod: "Microsoft stable .deb package",
    methodFilter: "Official .deb",
    lastVerified: "2026-11-06",
    searchTerms: ["edge", "microsoft", "browser", "install edge on debian", "apt"],
    steps: [
      {
        title: "Confirm your system architecture",
        description: "Microsoft's Linux release is a 64-bit Intel / AMD package. Check that Debian reports amd64.",
        command: "dpkg --print-architecture",
        note: "Microsoft does not publish an official ARM64 Linux package for Edge.",
      },
      {
        title: "Open your downloads folder in the terminal",
        description: "Use Microsoft's official download link above, choose the Debian / Ubuntu .deb package, and save it in Downloads.",
        command: "cd ~/Downloads",
      },
      {
        title: "Install the downloaded package",
        description: "APT installs the local Microsoft package and resolves its dependencies. The wildcard accommodates the versioned filename.",
        command: "sudo apt install ./microsoft-edge-stable*.deb",
        note: "If more than one Edge .deb is in Downloads, remove old copies or specify the exact filename.",
      },
      {
        title: "Launch Microsoft Edge",
        description: "Start Edge from the application menu or launch the stable package from your terminal.",
        command: "microsoft-edge-stable",
      },
      {
        title: "Verify the package installation",
        description: "APT's package database reports the installed state and version.",
        command: "dpkg-query -W -f='${Status} ${Version}\\n' microsoft-edge-stable",
      },
    ],
    launchCommand: "microsoft-edge-stable",
    verifyCommand: "dpkg-query -W -f='${Status} ${Version}\\n' microsoft-edge-stable",
    uninstallCommand: "sudo apt remove microsoft-edge-stable",
    caution: "Download the .deb from Microsoft's official page and select the Debian / Ubuntu build. Do not use an ARM package or a third-party mirror.",
    troubleshooting: [
      {
        title: "APT reports that no package matched the wildcard",
        body: "Check that the download completed and that the filename begins with microsoft-edge-stable. Use the exact filename if several versions are present.",
        command: "ls -1 microsoft-edge-stable*.deb",
      },
      {
        title: "The package cannot be installed on this machine",
        body: "Confirm amd64 architecture and use a supported, up-to-date Debian release. Never bypass dependency or signature checks.",
        command: "dpkg --print-architecture",
      },
    ],
  },
  {
    slug: "brave",
    name: "Brave Browser",
    shortName: "Brave",
    description: "A privacy-focused browser with tracker blocking enabled by default.",
    logo: "brave",
    color: "#fb542b",
    officialUrl: "https://brave.com/",
    documentationUrl: "https://brave.com/linux/",
    documentationLabel: "Brave Linux install guide",
    supportedDebian: "Current Debian releases",
    architectures: "amd64 and arm64",
    installMethod: "Brave signed APT repository",
    methodFilter: "Vendor repository",
    lastVerified: "2026-11-06",
    searchTerms: ["brave", "privacy browser", "install brave on debian", "apt", "repository"],
    steps: [
      {
        title: "Check your system architecture",
        description: "Brave's official Linux repository supports 64-bit AMD / Intel and ARM systems.",
        command: "dpkg --print-architecture",
        note: "The expected Debian values are amd64 or arm64.",
      },
      {
        title: "Refresh package lists and install curl",
        description: "Curl is used only to download Brave's published keyring and APT source file.",
        command: "sudo apt update\nsudo apt install curl",
      },
      {
        title: "Install Brave's official signing key",
        description: "Save the key published by Brave into APT's keyring directory so packages can be verified.",
        command: "sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg",
      },
      {
        title: "Add Brave's official APT source",
        description: "This downloads Brave's signed source definition, which references the keyring installed in the previous step.",
        command: "sudo curl -fsSLo /etc/apt/sources.list.d/brave-browser-release.sources https://brave-browser-apt-release.s3.brave.com/brave-browser.sources",
      },
      {
        title: "Refresh package lists",
        description: "APT now reads package metadata from Debian and Brave's official repository.",
        command: "sudo apt update",
      },
      {
        title: "Install Brave Browser",
        description: "Install the stable release using its package name from Brave's signed repository.",
        command: "sudo apt install brave-browser",
      },
      {
        title: "Launch Brave",
        description: "Start the browser from your desktop menu or terminal.",
        command: "brave-browser",
      },
      {
        title: "Verify the installation",
        description: "Check that the installed Brave binary responds with its version.",
        command: "brave-browser --version",
      },
    ],
    launchCommand: "brave-browser",
    verifyCommand: "brave-browser --version",
    uninstallCommand: "sudo apt remove brave-browser",
    caution: "These steps use Brave's signed APT repository. They do not pipe a remote install script directly into a shell.",
    troubleshooting: [
      {
        title: "APT reports a missing signing key",
        body: "Confirm the keyring download completed and the .sources file was installed from Brave's official host, then refresh APT metadata.",
        command: "sudo apt update",
      },
      {
        title: "The package is not found",
        body: "Check the architecture output and ensure the Brave source file exists before retrying the package index refresh.",
        command: "dpkg --print-architecture\ncat /etc/apt/sources.list.d/brave-browser-release.sources",
      },
    ],
  },
  {
    slug: "firefox",
    name: "Mozilla Firefox ESR",
    shortName: "Firefox ESR",
    description: "The Debian-maintained Extended Support Release of Mozilla Firefox.",
    logo: "firefoxbrowser",
    color: "#ff7139",
    officialUrl: "https://www.mozilla.org/firefox/",
    documentationUrl: "https://wiki.debian.org/Firefox",
    documentationLabel: "Debian Firefox guidance",
    supportedDebian: "Debian Stable",
    architectures: "Architectures published by the Debian archive",
    installMethod: "Debian stable archive",
    methodFilter: "Debian archive",
    lastVerified: "2026-11-06",
    searchTerms: ["firefox", "firefox esr", "mozilla", "install firefox on debian", "apt"],
    steps: [
      {
        title: "Refresh Debian package lists",
        description: "Get the current package index for the Debian release configured on this machine.",
        command: "sudo apt update",
      },
      {
        title: "Install Firefox ESR",
        description: "Debian Stable distributes Firefox as the firefox-esr package from its own archive.",
        command: "sudo apt install firefox-esr",
        note: "This installs the Debian-maintained ESR, not Mozilla's separate rapid-release APT package.",
      },
      {
        title: "Launch Firefox ESR",
        description: "Open Firefox from your application menu or start it from the terminal.",
        command: "firefox-esr",
      },
      {
        title: "Verify the installed version",
        description: "The output should identify the installed Mozilla Firefox ESR release.",
        command: "firefox-esr --version",
      },
    ],
    launchCommand: "firefox-esr",
    verifyCommand: "firefox-esr --version",
    uninstallCommand: "sudo apt remove firefox-esr",
    caution: "Firefox ESR follows Debian's supported package and security-update cadence. Package availability and version depend on the configured Debian release.",
    troubleshooting: [
      {
        title: "APT cannot locate firefox-esr",
        body: "Check that your Debian repository components are enabled for the release and refresh the package index. Do not add an unrelated repository to work around a missing package.",
        command: "sudo apt update\napt-cache policy firefox-esr",
      },
    ],
  },
  {
    slug: "chromium",
    name: "Chromium",
    shortName: "Chromium",
    description: "The open-source browser project packaged and maintained by Debian.",
    logo: "chromium",
    color: "#5b9dd9",
    officialUrl: "https://www.chromium.org/",
    documentationUrl: "https://wiki.debian.org/Chromium",
    documentationLabel: "Debian Chromium guidance",
    supportedDebian: "Debian Stable, where the package is available",
    architectures: "Architectures published by the Debian archive",
    installMethod: "Debian stable archive",
    methodFilter: "Debian archive",
    lastVerified: "2026-11-06",
    searchTerms: ["chromium", "open source browser", "install chromium on debian", "apt"],
    steps: [
      {
        title: "Refresh Debian package lists",
        description: "Refresh APT's view of packages available for your selected Debian release.",
        command: "sudo apt update",
      },
      {
        title: "Check Chromium package availability",
        description: "Debian's package archive and security support vary by release. Check the candidate before installation.",
        command: "apt-cache policy chromium",
      },
      {
        title: "Install Chromium from Debian",
        description: "When a package candidate is available for your release, install it from Debian's configured archive.",
        command: "sudo apt install chromium",
        note: "If APT has no candidate, stop and check the Debian Chromium guidance for your release. Do not substitute an unofficial repository.",
      },
      {
        title: "Launch Chromium",
        description: "Start the Debian-packaged browser from the desktop menu or terminal.",
        command: "chromium",
      },
      {
        title: "Verify the installed version",
        description: "Print the version of the Debian Chromium executable.",
        command: "chromium --version",
      },
    ],
    launchCommand: "chromium",
    verifyCommand: "chromium --version",
    uninstallCommand: "sudo apt remove chromium",
    caution: "Chromium availability and security support vary by Debian release. Review the Debian wiki and security tracker if your release is old or no package candidate is shown.",
    troubleshooting: [
      {
        title: "There is no installation candidate",
        body: "Chromium is not available from every Debian release or configured archive. Review Debian's package status instead of adding a third-party source.",
        command: "apt-cache policy chromium",
      },
      {
        title: "Check package and security status",
        body: "The Debian wiki links to release-specific package and security information.",
      },
    ],
  },
  {
    slug: "opera",
    name: "Opera",
    shortName: "Opera",
    description: "A feature-rich browser with integrated tools and a familiar desktop experience.",
    logo: "opera",
    color: "#ff1b2d",
    officialUrl: "https://www.opera.com/",
    documentationUrl: "https://deb.opera.com/manual.html",
    documentationLabel: "Opera APT repository instructions",
    supportedDebian: "Debian-based systems using APT",
    architectures: "amd64 and arm64 packages are published",
    installMethod: "Opera signed APT repository",
    methodFilter: "Vendor repository",
    lastVerified: "2026-11-06",
    searchTerms: ["opera", "browser", "install opera on debian", "apt", "repository"],
    steps: [
      {
        title: "Refresh package lists and install GnuPG",
        description: "GnuPG converts Opera's published signing key into an APT keyring.",
        command: "sudo apt update\nsudo apt install wget gnupg",
      },
      {
        title: "Install Opera's signing key",
        description: "Download the key from Opera's own repository host and convert it to a binary keyring.",
        command: "wget -qO- https://deb.opera.com/archive.key | gpg --dearmor | sudo dd of=/usr/share/keyrings/opera-browser.gpg",
        note: "This command writes a keyring file; it does not execute downloaded content.",
      },
      {
        title: "Add the official Opera repository",
        description: "Use the stable suite exactly as Opera documents, even when Debian itself is testing or unstable.",
        command: "echo \"deb [signed-by=/usr/share/keyrings/opera-browser.gpg] https://deb.opera.com/opera-stable/ stable non-free\" | sudo tee /etc/apt/sources.list.d/opera-archive.list",
      },
      {
        title: "Refresh APT from the new source",
        description: "APT downloads package metadata for the Opera stable repository.",
        command: "sudo apt update",
      },
      {
        title: "Install Opera stable",
        description: "Install the stable package from Opera's signed repository.",
        command: "sudo apt install opera-stable",
      },
      {
        title: "Launch Opera",
        description: "Start Opera from the applications menu or from your terminal.",
        command: "opera",
      },
      {
        title: "Verify the installed version",
        description: "Print the installed Opera version.",
        command: "opera --version",
      },
    ],
    launchCommand: "opera",
    verifyCommand: "opera --version",
    uninstallCommand: "sudo apt remove opera-stable",
    caution: "Opera's own instructions specify the stable repository suite even when the operating system uses Debian testing or unstable.",
    troubleshooting: [
      {
        title: "APT warns about a conflicting distribution",
        body: "Keep the Opera source suite set to stable, exactly as the vendor documentation specifies. Do not replace it with your Debian codename.",
        command: "cat /etc/apt/sources.list.d/opera-archive.list",
      },
      {
        title: "The repository signature cannot be verified",
        body: "Recheck that the keyring was saved at the same path used by the source entry, then refresh package metadata.",
        command: "sudo apt update",
      },
    ],
  },
];