
/**
 * Performs RC4 encryption/decryption.
 * @param {string} encodedData - The data to be processed.
 * @param {string} key - The key for encryption/decryption.
 * @returns {string} The RC4-processed string.
 */
function rc4Decrypt(encodedData, key) {
    var sBox = [], // sBox is used in the algorithm for permutation
        j = 0, // j is a counter used for the permutation of sBox
        temp, // temp is used for swapping values
        decryptedText = '', // decryptedText will store the final output
        encodedDataHex = ''; // encodedDataHex will store the hex-encoded form of the data

    // Decode the base64 encoded input
    encodedData = atob(encodedData);

    // Convert the encoded data to hex
    for (var i = 0; i < encodedData.length; i++) {
        encodedDataHex += '%' + ('00' + encodedData.charCodeAt(i).toString(16)).slice(-2);
    }

    // Decode the hex-encoded string
    encodedData = decodeURIComponent(encodedDataHex);

    // Initialize the sBox with values 0 to 255
    for (var i = 0; i < 256; i++) {
        sBox[i] = i;
    }

    // Perform the key scheduling algorithm (KSA) to permute the sBox
    for (var i = 0; i < 256; i++) {
        j = (j + sBox[i] + key.charCodeAt(i % key.length)) % 256;
        temp = sBox[i];
        sBox[i] = sBox[j];
        sBox[j] = temp;
    }

    // Reset counters for the pseudo-random generation algorithm (PRGA)
    var i = 0;
    j = 0;

    // Perform the PRGA and decrypt the data
    for (var k = 0; k < encodedData.length; k++) {
        i = (i + 1) % 256;
        j = (j + sBox[i]) % 256;
        temp = sBox[i];
        sBox[i] = sBox[j];
        sBox[j] = temp;
        decryptedText += String.fromCharCode(encodedData.charCodeAt(k) ^ sBox[(sBox[i] + sBox[j]) % 256]);
    }

    return decryptedText;
}


/**
 * Wrapper function for rc4Decrypt to handle array inputs.
 * @param {Array} arrayName - Array of strings to be encrypted/decrypted.
 * @param {number} index - Index in the array to select the string.
 * @param {string} key - The RC4 key.
 * @returns {string} Encrypted/Decrypted string from the array.
 */
function rc4DecryptFromArray(arrayName, index, key) {
    return rc4Decrypt(arrayName[index - 0x0], key);
}

/**
 * Shuffles an array by rotating its elements.
 * @param {Array} array - The array to be shuffled.
 * @param {number} shuffleBy - The number of places to rotate the array.
 */
function shuffleArray(array, shuffleBy) {
    shuffleBy = Math.abs(parseInt(shuffleBy, 10)) % array.length;
    while (shuffleBy--) {
        array.push(array.shift());
    }
}

/**
 * Base64 decoding function.
 * @param {string} input - The base64-encoded string.
 * @returns {string} The decoded string.
 */
function atob(input) {
    return Buffer.from(input, 'base64').toString('binary');
}

module.exports = {
    rc4DecryptFromArray,
    shuffleArray
}