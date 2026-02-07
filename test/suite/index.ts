import * as path from "path";
import * as Mocha from "mocha";
import * as fs from "fs";

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: "tdd", color: true, timeout: 10000 });
  const testsRoot = path.resolve(__dirname);

  return new Promise<void>((resolve, reject) => {
    // Find all test files
    fs.readdir(testsRoot, (err, files) => {
      if (err) {
        return reject(err);
      }

      // Add files to the test suite
      files
        .filter((f) => f.endsWith(".test.js"))
        .forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      // Run the mocha test
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} test(s) failed.`));
        } else {
          resolve();
        }
      });
    });
  });
}
