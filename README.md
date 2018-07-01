# markdown-electron <img src="./static/icons/icon.svg" alt="markdown-electron logo" height="180px" align="right" />

Markdown viewer based on [electron](https://electron.atom.io/) and
[mume](https://github.com/shd101wyy/mume).

## Installation

### Pre-Built

Download and unpack the latest release from the releases section.

### From Source

1. Install recent `nodejs` and `npm`.
2. Clone this repo
    ```
    git clone https://github.com/tbung/markdown-electron.git
    cd markdown-electron
    ```
3. Install dependencies
    ```
    npm install
    ```
4. Run the app
    ```
    npm start
    ```
5. Build the app
    ```
    npm run dist
    ```
    or (for Windows and Linux)
    ```
    npm run dist -- -wl
    ```

## PDF Export

For pdf export you need to install puppeteer globally. 
```
npm i -g puppeteer
```

To fix any sandbox related issues on linux you need to point the environment
variable `CHROME_DEVEL_SANDBOX` to the appropriate binary (in some file that
gets sourced on login). For example on Arch Linux using an installed `google-chrome`:
```shell
export CHROME_DEVEL_SANDBOX=/opt/google/chrome/chrome-sandbox
```
or using an installed `chromium`:
```
export CHROME_DEVEL_SANDBOX=/usr/lib/chromium/chrome-sandbox
```

## Note on MathJax

[MathJax support is currently broken in the underlying render library](https://github.com/shd101wyy/markdown-preview-enhanced/issues/775), please
use KaTeX. An overview of features supported by KaTeX can be found
[here](https://khan.github.io/KaTeX/function-support.html).
