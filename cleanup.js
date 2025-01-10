const fs = require("fs");
const path = require("path");

// Path to the source folder
const srcDir = path.resolve(__dirname, "src");

// Recursively delete all `.js` and `.js.map` files
function deleteCompiledFiles(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      // Recurse into subdirectories
      deleteCompiledFiles(filePath);
    } else if (file.endsWith(".js") || file.endsWith(".js.map")) {
      // Delete compiled JavaScript files
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${filePath}`);
    }
  });
}

deleteCompiledFiles(srcDir);
console.log("All compiled files have been deleted.");
