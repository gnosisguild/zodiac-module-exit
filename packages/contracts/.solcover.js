module.exports = {
  skipFiles: ["test/TestToken", "test/TestAvatar"],
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
  },
};
