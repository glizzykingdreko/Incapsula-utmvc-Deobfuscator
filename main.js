
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;
const fs = require("fs");

const extractCodeFromHex = require("./transformers/extractCodeFromHex.js");
const normalizeStringLiterals = require("./transformers/normalizeStringLiterals.js");
const reorderSwitchCases = require("./transformers/reorderSwitchCases.js");
const replaceInliningFunctions = require("./transformers/replaceInlineFunctions.js")
const simplifyBinaryExpressions = require("./transformers/simplifyBinaryExpressions.js")
const debfuscateRC4Encryption = require("./transformers/deobfuscateRC4.js")
const virtualizeEncryption = require("./transformers/virtualizeEncryption.js")

/**
 * Deobfuscate the code from the input file and save it to the output file
 * @param {string} inputfile - The input file
 * @param {string} outputFile - The output file
 * @param {boolean} savePartial - If true, save the partial deobfuscated code to <outputFile>.partial.js
 * @param {boolean} virtualize - If true, virtualize the encryption function
 * @returns {Object} The sandbox object of the AST
 * @throws {Error} If the input file does not exist
*/
function deobfuscateCode(inputfile, outputFile, savePartial=false, virtualize=false) {
    console.log("------------------------- Incapsula UTMVC Deobfuscator -------------------------")

    inputfile = inputfile.replace(/\.js$/, '');
    outputFile = outputFile.replace(/\.js$/, '') || './output';

    // Extract code from hex
    let initialCode;
    try {
        initialCode = fs.readFileSync(`${inputfile}.js`, 'utf-8');
    } catch (e) {
        console.log("----| Failed to read input file");
        return;
    }
    let ast;
    try {
        ast = extractCodeFromHex(initialCode);
        console.log(`----| Extracted code from hex`);
        if (savePartial) {
            let partialFile = `${outputFile}.partial.js`;
            console.log(`----| Saving partial deobfuscated code to ${partialFile}`);
            fs.writeFileSync(partialFile, generate(ast).code, 'utf-8');
        }
    } catch (e) {
        console.log("----| Failed to extract code from hex, maybe you already did it?");
        console.log("----| Trying to parse the file as is");
        ast = parser.parse(initialCode, {});
    }
    
    // Deobfuscate
    normalizeStringLiterals(ast);
    console.log("----| Normalized string literals");
    console.log(`----| Deobfuscated RC4 encryption, replaced ${debfuscateRC4Encryption(ast)} matches`);
    console.log(`----| Reordered switch cases, replaced ${reorderSwitchCases(ast)} matches`);
    console.log(`----| Replaced ${replaceInliningFunctions(ast)} inlining functions`);
    simplifyBinaryExpressions(ast);
    console.log("----| Simplified binary expressions");
    
    // Save
    let code = generate(ast).code;
    outputFile = `${outputFile}.js`;
    fs.writeFileSync(outputFile, code);
    console.log(`----| Saved deobfuscated code to ${outputFile}`);
    let context = virtualizeEncryption(ast);
    if (context) {
        console.log(`----| Virtualized encryption function`);
    } else {
        console.log(`----| Failed to virtualize encryption function`);
    }
    console.log("---------------------------------------------------------------------------------");
    return context;
}

let inputfile = process.argv[2] || "./script";
let outputFile = process.argv[3] || "./output";
let savePartial = process.argv[4] === "true";
let virtualize = process.argv[5] === "true";

deobfuscateCode(inputfile, outputFile, savePartial, virtualize);