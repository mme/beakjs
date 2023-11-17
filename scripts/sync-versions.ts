import * as fs from "fs";

// Define the paths for the VERSION file and the package.json files
const versionFilePath = "./VERSION";
const rootPackageJsonPath = "./package.json";
const otherPackageJsonPaths = [
  rootPackageJsonPath,
  "./packages/openai/package.json",
  "./packages/server/package.json",
  "./packages/core/package.json",
  "./packages/react/package.json",
];

// This function reads the VERSION file and returns the version string
function readVersionFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf8").trim();
}

// This function reads a package.json file and returns its content as a JSON object
function readPackageJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// This function writes the updated JSON content back to the package.json file
function writePackageJson(filePath: string, content: any): void {
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n");
}

// This function updates the version and dependencies in targetPackageJson using the versions from rootPackageJson
function updatePackageData(
  rootPackageJson: any,
  targetPackageJson: any,
  newVersion: string
): boolean {
  let hasChanged = false;

  // Update version
  if (newVersion && targetPackageJson.version !== newVersion) {
    targetPackageJson.version = newVersion;
    hasChanged = true;
  }

  // Update dependencies if they exist in rootPackageJson
  const typesOfDependencies = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
  ];
  typesOfDependencies.forEach((depType) => {
    if (rootPackageJson[depType] && targetPackageJson[depType]) {
      Object.keys(targetPackageJson[depType]).forEach((dep) => {
        if (dep.startsWith("@beakjs/")) {
          targetPackageJson[depType][dep] = newVersion;
          hasChanged = true;
        } else if (rootPackageJson[depType][dep]) {
          targetPackageJson[depType][dep] = rootPackageJson[depType][dep];
          hasChanged = true;
        }
      });
    }
  });

  return hasChanged;
}

// Main function to update version and dependencies versions in all package.json files
function updateVersionsAndDependencies(): void {
  const newVersion = readVersionFile(versionFilePath);
  const rootPackageJson = readPackageJson(rootPackageJsonPath);

  otherPackageJsonPaths.forEach((packageJsonPath) => {
    try {
      const targetPackageJson = readPackageJson(packageJsonPath);
      const hasChanged = updatePackageData(
        rootPackageJson,
        targetPackageJson,
        newVersion
      );

      if (hasChanged) {
        writePackageJson(packageJsonPath, targetPackageJson);
        console.log(`Updated version and dependencies in ${packageJsonPath}`);
      } else {
        console.log(`No changes made to ${packageJsonPath}`);
      }
    } catch (error) {
      console.error(`Error updating ${packageJsonPath}: ${error}`);
    }
  });
}

updateVersionsAndDependencies();
