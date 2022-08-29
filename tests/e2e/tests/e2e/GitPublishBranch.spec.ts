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
 import { CLASSES } from '../../inversify.types';
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
//  import { ITestWorkspaceUtil } from '../../utils/workspace/ITestWorkspaceUtil';
 import { WorkspaceHandlingTests } from '../../testsLibrary/WorkspaceHandlingTests';
 import { ProjectAndFileTests } from '../../testsLibrary/ProjectAndFileTests';
 import { GitHubUtil } from '../../utils/VCS/github/GitHubUtil';
 import { TimeoutConstants } from '../../TimeoutConstants';

 const driverHelper: DriverHelper = e2eContainer.get(CLASSES.DriverHelper);
 const browserTabsUtil: BrowserTabsUtil = e2eContainer.get(CLASSES.BrowserTabsUtil);
 const ide: Ide = e2eContainer.get(CLASSES.Ide);
 const quickOpenContainer: QuickOpenContainer = e2eContainer.get(CLASSES.QuickOpenContainer);
 const editor: Editor = e2eContainer.get(CLASSES.Editor);
 const topMenu: TopMenu = e2eContainer.get(CLASSES.TopMenu);
 const projectTree: ProjectTree = e2eContainer.get(CLASSES.ProjectTree);
 const gitPlugin: GitPlugin = e2eContainer.get(CLASSES.GitPlugin);
//  const testWorkspaceUtils: ITestWorkspaceUtil = e2eContainer.get<ITestWorkspaceUtil>(TYPES.WorkspaceUtil);
 const workspaceNameHandler: WorkspaceNameHandler = e2eContainer.get(CLASSES.WorkspaceNameHandler);
 const workspaceHandlingTests: WorkspaceHandlingTests = e2eContainer.get(CLASSES.WorkspaceHandlingTests);
 const projectAndFileTests: ProjectAndFileTests = e2eContainer.get(CLASSES.ProjectAndFileTests);
 const gitHubUtils: GitHubUtil = e2eContainer.get<GitHubUtil>(CLASSES.GitHubUtil);



  // const testWorkspaceUtil: TestWorkspaceUtil = codereadyContainer.get(TYPES.WorkspaceUtil);

  const changedFile = 'README.md';
  const branchName = workspaceNameHandler.generateWorkspaceName('checkGitPublishBranch', 5);
  const file = `https://github.com/${TestConstants.TS_GITHUB_TEST_REPO}/blob/${branchName}/README.md`;

  const projectName: string = 'python-hello-world';
  const fileName: string = 'README.md';
  const workspaceName: string = 'python-hello-world';
  const stackName: string = 'Python';

  // suiteTeardown(async () => {
  //     await testWorkspaceUtil.stopAndDeleteWorkspaceByName(workspaceName);
  //  });

  suite('Publish branch in git extension', async () => {
      workspaceHandlingTests.createAndOpenWorkspace(stackName);

      projectAndFileTests.waitWorkspaceReadiness(projectName, fileName);

      test('Generate a SSH key', async () => {
          await topMenu.selectOption('View', 'Find Command...');
         //  // workaround - reopen 'Find Command' container - https://github.com/eclipse/che/issues/19793
          await topMenu.selectOption('View', 'Find Command...');
          await quickOpenContainer.typeAndSelectSuggestion('SSH', 'SSH: Generate Key...');
          await ide.waitNotificationAndClickOnButton('Key pair successfully generated, do you want to view the public key', 'View');
          await editor.waitEditorOpened('Untitled-0');
          await editor.waitText('Untitled-0', 'ssh-rsa');
      });

      test('Add a SSH key to GitHub side and clone by ssh link', async () => {
          const publicSshKey = await editor.getEditorHiddenText('Untitled-0');
          console.log(publicSshKey);
          await gitHubUtils.getPublicSshKeys(TestConstants.TS_GITHUB_TEST_REPO_ACCESS_TOKEN);
          await gitHubUtils.addPublicSshKeyToUserAccount(TestConstants.TS_GITHUB_TEST_REPO_ACCESS_TOKEN, workspaceName, publicSshKey);
          await cloneTestRepo();
          await driverHelper.wait(TimeoutConstants.TS_IMPORT_PROJECT_DEFAULT_POLLING);
      });

      test('Create a new branch, add changes, commit and push', async function changeCommitAndPushFunc() {
          const currentDate: string = Date.now().toString();
          const readmeFileContentXpath: string = `//div[@id='readme']//p[contains(text(), '${currentDate}')]`;
          await topMenu.selectOption('View', 'Find Command...');
          await quickOpenContainer.typeAndSelectSuggestion('branch', 'Git: Create Branch...');
          await quickOpenContainer.type(`${branchName}${Key.ENTER}`);

          await projectTree.expandPathAndOpenFile('Spoon-Knife', changedFile);
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
    //   workaround - reopen 'Find Command' container - https://github.com/eclipse/che/issues/19793
      await topMenu.selectOption('View', 'Find Command...');
      await quickOpenContainer.typeAndSelectSuggestion('clone', 'Git: Clone');
      await quickOpenContainer.typeAndSelectSuggestion(sshLinkToRepo, confirmMessage);
      await gitPlugin.clickOnSelectRepositoryButton();
  }


