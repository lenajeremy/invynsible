#! /usr/bin/env node
import ora from "ora";
import cmd from "./cmd.js";
import path from "path";
import fs from "fs/promises";
import os from "os";

const HOME_DIR = os.homedir();
const APP_DIR = ".scout";

const BASE_DIR = path.join(HOME_DIR, APP_DIR);

async function runInvynsible(port) {
  console.log("\n<=============== Invynsible 👻 ===============> \n");

  const spinner = ora("");

  await cloneFilesFromGithub(spinner);
  await installNpmPackages(spinner);
  await runBuild(spinner);

  await cmd(["yarn", "start"], { cwd: BASE_DIR });
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

  spinner.text = "Copying files to device \n";
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
      await cmd(["npm", "run", "build"], {
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

runInvynsible();
