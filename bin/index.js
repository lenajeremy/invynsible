#! /usr/bin/env node
// import ora from "ora";
// import cmd from "./cmd.js";
// import path from "path";
// import fs from "fs/promises";
// import os from "os";
// import yargs from "yargs/yargs";

const cmd = require("./cmd");
const path = require("path");
const fs = require("fs/promises");
const os = require("os");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const HOME_DIR = os.homedir();
const APP_DIR = ".scout";
const BASE_DIR = path.join(HOME_DIR, APP_DIR);


(async () => {
  const { default: ora } = await import("ora");
  const { default: cmd } = await import("./cmd.js");

  yargs(hideBin(process.argv))
    .scriptName("invynsible")
    .usage("$0 <cmd> [args]")
    .command(
      "start [port]",
      "Starts up Scout on the specified port -- default = 2002",
      (yargs) => {
        yargs.positional("port", {
          type: "number",
          default: 2002,
          describe: "the port to start scout on",
        });
      },
      function (argv) {
        runInvynsible(argv.port);
      }
    )
    .help().argv;


    async function runInvynsible(port) {
      console.log("\n<=============== Invynsible 👻 ===============> \n");
    
      const spinner = ora("");
    
      await cloneFilesFromGithub(spinner);
      await installNpmPackages(spinner);
      await runBuild(spinner);
    
      await cmd(["npx", "next", "start", "--port", port], { cwd: BASE_DIR });
    }
    
    function invynsibleJSONHelper(basedir) {
      async function hasJSONSettings() {
        try {
          const invynsibleJSON = await fs.readFile(
            path.join(BASE_DIR, "invynsible.settings.json"),
            "utf-8"
          );
          return Boolean(invynsibleJSON.trim());
        } catch {
          return false;
        }
      }
    
      async function getJSONSettings() {
        const hasSettings = await hasJSONSettings();
    
        if (hasSettings) {
          const invynsibleJSON = await fs.readFile(
            path.join(BASE_DIR, "invynsible.settings.json"),
            "utf-8"
          );
          return JSON.parse(invynsibleJSON);
        }
        return null;
      }
    
      async function updateSettingsValue(key, value) {
        const currentSettingsValue = (await getJSONSettings()) || {};
    
        currentSettingsValue[key] = value;
    
        try {
          await fs.writeFile(
            path.join(BASE_DIR, "invynsible.settings.json"),
            JSON.stringify(currentSettingsValue)
          );
          return true;
        } catch {
          return false;
        }
      }
    
      return { hasJSONSettings, getJSONSettings, updateSettingsValue };
    }
    
    async function cloneFilesFromGithub(spinner) {
      const { updateSettingsValue, getJSONSettings } = invynsibleJSONHelper();
    
      const settings = await getJSONSettings();
    
      spinner.text = "Downloading package code🚀 \n";
      spinner.start();
      try {
        if (!(settings && settings["hasClonedRepo"])) {
          await cmd(
            ["git", "clone", "https://github.com/lenajeremy/scout", APP_DIR],
            {
              cwd: HOME_DIR,
            }
          );
    
          await updateSettingsValue("hasClonedRepo", true);
        }
    
        spinner.succeed("Files copied successfully");
      } catch (error) {
        console.log(error);
        spinner.fail("Failed to clone repo");
        process.exit(1);
      }
    }
    
    async function installNpmPackages(spinner) {
      const { updateSettingsValue, getJSONSettings } = invynsibleJSONHelper();
    
      const settings = await getJSONSettings();
    
      try {
        spinner.text = "Installing packages";
        spinner.start();
    
        if (!(settings && settings["hasInstalledPackages"])) {
          await cmd(["npm", "install"], { cwd: BASE_DIR });
          await updateSettingsValue("hasInstalledPackages", true);
        }
    
        spinner.succeed("Packages installed successfully");
      } catch (error) {
        console.log(error);
        spinner.fail("Failed to install packages");
        process.exit(1);
      }
    }
    
    async function runBuild(spinner) {
      const { updateSettingsValue, getJSONSettings } = invynsibleJSONHelper();
      const settings = await getJSONSettings();
    
      try {
        spinner.text = "Running build...";
        spinner.start();
    
        if (!(settings && settings["hasBuiltProject"])) {
          await cmd(["npx", "next", "build"], {
            cwd: BASE_DIR,
          });
          await updateSettingsValue("hasBuiltProject", true);
        }
    
        spinner.succeed("Build Completed");
      } catch (error) {
        console.log(error);
        spinner.fail("Error while running build");
        process.exit(1);
      }
    }

})();


