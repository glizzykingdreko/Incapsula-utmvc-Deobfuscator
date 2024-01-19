# Incapsula UTMVC Deobfuscator

A tool designed to decode, deobfuscate, and simplify JavaScript files obfuscated by Incapsula / Imperva UTMVC system (the script that generates the `__utmvc` cookie). It focuses on enhancing readability and understandability of code that undergoes complex obfuscation techniques.

## Table of Contents
- [Incapsula UTMVC Deobfuscator](#incapsula-utmvc-deobfuscator)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Usage](#usage)
    - [Example of a non decoded script](#example-of-a-non-decoded-script)
    - [Example of a decoded script](#example-of-a-decoded-script)
  - [Structure](#structure)
  - [Contributing](#contributing)
  - [License](#license)
  - [My links](#my-links)

## Features
- **Extract and decode hexadecimal** encoded strings in JavaScript files.
- **Normalize string literals** for consistency and readability.
- **Reorder switch cases** for a more logical flow.
- **Replace inlining functions** for improved clarity.
- **Simplify binary expressions** for better comprehension.
- **Deobfuscate RC4** encrypted content within the JavaScript.

## Prerequisites
- Node.js
- Babel libraries: `@babel/parser`, `@babel/generator`, `@babel/core`

## Usage
To run the deobfuscator:
```bash
node deobfuscate.js [inputFilePath] [outputFilePath] [savePartial] [virtualizeEncryption]
```
- `inputFilePath`: (Optional) Path to the input JavaScript file. Default is ./script.js.
- `outputFilePath`: (Optional) Path where the deobfuscated code will be saved. Default is ./output.js.
- `savePartial`: (Optional) Boolean flag to save partially deobfuscated code. (just decoded from hexadecimal) Default is false.
- `virtualizeEncryption`: (Optional) Boolean flag to virtualize the utmvc encryption function as **utmvcEncryption** and return the context. Default is false.

*Note* You can give as input file the original script that needs to be decoded from hex or the already decoded one.

### Example of a non decoded script
```js
(function() {
    var z = "";
    var b = "...";
    eval((function() {
        for (var i = 0; i < b.length; i += 2) {
            z += String.fromCharCode(parseInt(b.substring(i, i + 2), 16));
        }
        return z;
    }
    )());
}
)();
```
### Example of a decoded script
```js
var _0xd370 = [...];
(function (_0x41005c, _0x50988d) {
  var _0x47c759 = function (_0x63709d) {
    while (--_0x63709d) {
      _0x41005c['\x70\x75\x73\x68'](_0x41005c['\x73\x68\x69\x66\x74']());
    }
  };
  var _0x54bc8a = function () {
    // ...
```

### Virtualize encryption
```js
let context = deobfuscateCode("script", "output", false, true);
console.log(
  vm.runInNewContext(
    "utmvcEncryption('myBeautifulString', ['myBeautifulCookie'])",
    context
  )
);
```

## Structure
- `deobfuscate.js`: Main driver script coordinating the deobfuscation process.
- `transformers/`: Directory containing various transformation scripts.
    - `extractCodeFromHex.js`: Handles extraction and decoding of hexadecimal encoded strings.
    - `normalizeStringLiterals.js`: Normalizes string formats for consistency.
    - `reorderSwitchCases.js`: Reorganizes switch cases for readability.
    - `replaceInlineFunctions.js`: Substitutes inline functions with their actual content.
    - `simplifyBinaryExpressions.js`: Reduces complexity of binary expressions.
    - `deobfuscateRC4.js`: Decrypts content encrypted using RC4.
    - `virtualizeEncryption.js`: Virtualize the utmvc encryption function as **utmvcEncryption**.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT [License](LICENSE). See the LICENSE file for more details.

## My links
- [Website](https://glizzykingdreko.github.io)
- [GitHub](https://github.com/glizzykingdreko)
- [Twitter](https://mobile.twitter.com/glizzykingdreko)
- [Medium](https://medium.com/@glizzykingdreko)
- [Email](mailto:glizzykingdreko@protonmail.com)
