const fs = require('fs');
const path = require('path');

/**
 * Updates the proxy setting in frontend/package.json to match the actual server port
 * @param {number} port - The port the server is running on
 */
function updateFrontendProxy(port) {
  try {
    const packageJsonPath = path.join(__dirname, '../frontend/package.json');
    
    // Read the current package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if proxy needs to be updated
    const currentProxy = packageJson.proxy;
    const currentPort = currentProxy ? new URL(currentProxy).port : null;
    
    if (currentPort !== String(port)) {
      // Update the proxy
      packageJson.proxy = `http://localhost:${port}`;
      
      // Write the updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      console.log(`Updated frontend proxy to http://localhost:${port}`);
      console.log('You may need to restart the frontend server for changes to take effect.');
      
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Error updating frontend proxy:', err.message);
    return false;
  }
}

// Export for use in other files
module.exports = { updateFrontendProxy };

// If this script is run directly
if (require.main === module) {
  const port = process.argv[2];
  if (!port) {
    console.error('Please provide a port number as an argument');
    process.exit(1);
  }
  
  updateFrontendProxy(parseInt(port, 10));
} 