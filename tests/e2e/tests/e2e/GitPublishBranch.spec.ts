/*********************************************************************
 * Copyright (c) 2019 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

 import { e2eContainer } from '../../inversify.config';
 import { CLASSES, TYPES } from '../../inversify.types';
 import { Editor } from '../../pageobjects/ide/Editor';
 import { GitPlugin } from '../../pageobjects/ide/plugins/GitPlugin';
 import { Ide } from '../../pageobjects/ide/Ide';
 import { ProjectTree } from '../../pageobjects/ide/ProjectTree';
 import { QuickOpenContainer } from '../../pageobjects/ide/QuickOpenContainer';
 import { TestConstants } from '../../TestConstants';
 import { DriverHelper } from '../../utils/DriverHelper';
 import { TopMenu } from '../../pageobjects/ide/TopMenu';
 import { WorkspaceNameHandler } from '../../utils/WorkspaceNameHandler';
 import { By, Key } from 'selenium-webdriver';
 import { BrowserTabsUtil } from '../../utils/BrowserTabsUtil';
 import { WorkspaceHandlingTests } from '../../testsLibrary/WorkspaceHandlingTests';
 import { ProjectAndFileTests } from '../../testsLibrary/ProjectAndFileTests';
 import { GitHubUtil } from '../../utils/VCS/github/GitHubUtil';
 import { TimeoutConstants } from '../../TimeoutConstants';
import { ITestWorkspaceUtil } from '../../utils/workspace/ITestWorkspaceUtil';

 const driverHelper: DriverHelper = e2eContainer.get(CLASSES.DriverHelper);
 const browserTabsUtil: BrowserTabsUtil = e2eContainer.get(CLASSES.BrowserTabsUtil);
 const ide: Ide = e2eContainer.get(CLASSES.Ide);
 const quickOpenContainer: QuickOpenContainer = e2eContainer.get(CLASSES.QuickOpenContainer);
 const editor: Editor = e2eContainer.get(CLASSES.Editor);
 const topMenu: TopMenu = e2eContainer.get(CLASSES.TopMenu);
 const projectTree: ProjectTree = e2eContainer.get(CLASSES.ProjectTree);
 const gitPlugin: GitPlugin = e2eContainer.get(CLASSES.GitPlugin);
 const testWorkspaceUtil: ITestWorkspaceUtil = e2eContainer.get<ITestWorkspaceUtil>(TYPES.WorkspaceUtil);
 const workspaceNameHandler: WorkspaceNameHandler = e2eContainer.get(CLASSES.WorkspaceNameHandler);
 const workspaceHandlingTests: WorkspaceHandlingTests = e2eContainer.get(CLASSES.WorkspaceHandlingTests);
 const projectAndFileTests: ProjectAndFileTests = e2eContainer.get(CLASSES.ProjectAndFileTests);
 const gitHubUtils: GitHubUtil = e2eContainer.get<GitHubUtil>(CLASSES.GitHubUtil);

  const changedFile = 'README.md';
  const branchName = workspaceNameHandler.generateWorkspaceName('checkGitPublishBranch', 5);
  const file = `https://github.com/${TestConstants.TS_GITHUB_TEST_REPO}/blob/${branchName}/README.md`;

  const projectName: string = 'TestRepo';
  const fileName: string = 'README.md';
  const workspaceName: string = 'python-hello-world';
  const stackName: string = 'Python';
  const sshKeyName: string = 'publish-branch';

  suiteTeardown(async () => {
      await testWorkspaceUtil.stopAndDeleteWorkspaceByName(workspaceName);
   });

  suite('Publish branch in git extension', async () => {
      workspaceHandlingTests.createAndOpenWorkspace(stackName);

      projectAndFileTests.waitWorkspaceReadiness(workspaceName, fileName);

      test('Generate a SSH key', async () => {
          await topMenu.selectOption('View', 'Find Command...');
          // workaround - reopen 'Find Command' container - https://github.com/eclipse/che/issues/19793
          await topMenu.selectOption('View', 'Find Command...');
          await quickOpenContainer.typeAndSelectSuggestion('SSH generate', 'SSH: Generate Key...');
          await ide.waitNotificationAndClickOnButton('Key pair successfully generated, do you want to view the public key', 'View', TimeoutConstants.TS_OPEN_EDITOR_TIMEOUT);
          await editor.waitEditorOpened('Untitled-0');
          await editor.waitText('Untitled-0', 'ssh-rsa');
      });

      test('Add a SSH key to GitHub side and clone by ssh link', async () => {
          await gitHubUtils.deletePublicSshKeyByName(TestConstants.TS_GITHUB_TEST_REPO_ACCESS_TOKEN, sshKeyName);

            // const publicSshKey = await editor.getEditorHiddenText('Untitled-0');
          const publicSshKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDHf329lnI/hcoZIuiecBqhjN8k8DcFEXaYcqGv+tZpWgbH6Tq/sjEZvmNHRN9MBhu7q/iYBbzhU5o/18WTk8jLqz7eiyY+Pw8Kk4uxfFzmfzeLo6t32gIf5nKJrRab0H9/SiW6pmGo/jZTSgPQRypgtsY04Ztk3q7I8t0C0/Jj8YrdkRZb80zb69vsmNkFYkAKshmVUOC+eKX7oQL2uZ6C+UwCKz1TokDlfG21/eEG5qwfzQJcLTBFF9oH17/ZjLurC5vZoC7iT6fHXTQAae411qVKGSAsuEu9zJFynODUZEeblVdtat4t/CmfOAcjndFc17BuGS7ZDe/GBE5PxmPFp/XgeZn/QC8WxrKmTaldApCUN5/9Gx5IVuR1XJzCpbZ2YzJKXQ/r17DFjH8UrBTndb7mowKnVI1BR9sF9J0xZr9oG35t6QkEvFEXx1gXFHIUz6JwiR1yrqaXvAeemHMZtLIrxpVsClkFTGhPrrVPcUGTn5LvRafmRkE9Abl6U83A5ZZpOjBPYdcO3qjvUnkJPrG9g4mXrYCeoH+0WzE//FXnxqBAh0mDro2L2d9ehDTxIgw9N0f2yn7wqXuAWWOVXYrQTvEF8L+1CDAI5NuIxkoOwGDw1BDMnJLBjedCju5n1B8MZ8Y0OZecmey1oThN/Kke2GiL+/H3ULV4/aVBRQ== root@workspacedbde154b5be945b9-7c9cc566cf-pkrsv';

          console.log('>>' + publicSshKey + '<<');
          await gitHubUtils.addPublicSshKeyToUserAccount(TestConstants.TS_GITHUB_TEST_REPO_ACCESS_TOKEN, sshKeyName, publicSshKey);
          await cloneTestRepo();
          await driverHelper.wait(TimeoutConstants.TS_IMPORT_PROJECT_DEFAULT_POLLING);
      });

      test('Create a new branch, add changes, commit and push', async function changeCommitAndPushFunc() {
          const currentDate: string = Date.now().toString();
          const readmeFileContentXpath: string = `//div[@id='readme']//p[contains(text(), '${currentDate}')]`;

          await topMenu.selectOption('View', 'Find Command...');
          await quickOpenContainer.typeAndSelectSuggestion('branch', 'Git: Create Branch...');
          await quickOpenContainer.type(`${branchName}${Key.ENTER}`);

          await projectTree.expandPathAndOpenFile(projectName, changedFile);
          await editor.type(changedFile, currentDate + '\n', 1);
          await gitPlugin.openGitPluginContainer();
          await gitPlugin.waitChangedFileInChagesList(changedFile);
          await gitPlugin.stageAllChanges(changedFile);
          await gitPlugin.waitChangedFileInChagesList(changedFile);
          await gitPlugin.typeCommitMessage(this.test!.title + currentDate);
          await gitPlugin.commitFromCommandMenu();
          await gitPlugin.pushChangesFromCommandMenu();
          await driverHelper.waitAndClick(By.xpath(`//button[@class='theia-button main']`));
          await gitPlugin.waitDataIsSynchronized();

          // sometimes it takes some time for github to show created branch page
          await driverHelper.wait(TimeoutConstants.TS_SELENIUM_LOAD_PAGE_TIMEOUT);

          await browserTabsUtil.navigateTo(file);
          await driverHelper.waitVisibility(By.xpath(readmeFileContentXpath));
      });

  });

  async function cloneTestRepo() {
      const sshLinkToRepo: string = 'git@github.com:' + TestConstants.TS_GITHUB_TEST_REPO + '.git';
      const confirmMessage = 'Clone from URL, ' + sshLinkToRepo;
      await topMenu.selectOption('View', 'Find Command...');
      await quickOpenContainer.typeAndSelectSuggestion('clone', 'Git: Clone');
      await quickOpenContainer.typeAndSelectSuggestion(sshLinkToRepo, confirmMessage);
      await gitPlugin.clickOnSelectRepositoryButton();

      await ide.waitNotificationAndClickOnButton('Would you like to open the cloned repository, or add it to the current workspace?', 'Open');
  }
