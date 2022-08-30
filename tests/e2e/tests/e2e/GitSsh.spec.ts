/*********************************************************************
 * Copyright (c) 2022 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { assert } from 'chai';
import { e2eContainer } from '../../inversify.config';
import { CLASSES, TYPES } from '../../inversify.types';
import { Editor } from '../../pageobjects/ide/Editor';
import { GitPlugin } from '../../pageobjects/ide/plugins/GitPlugin';
import { Ide } from '../../pageobjects/ide/Ide';
import { ProjectTree } from '../../pageobjects/ide/ProjectTree';
import { QuickOpenContainer } from '../../pageobjects/ide/QuickOpenContainer';
import { TestConstants } from '../../TestConstants';
import { DriverHelper } from '../../utils/DriverHelper';
import { GitHubUtil } from '../../utils/VCS/github/GitHubUtil';
import { TopMenu } from '../../pageobjects/ide/TopMenu';
import { TimeoutConstants } from '../../TimeoutConstants';
import { ITestWorkspaceUtil } from '../../utils/workspace/ITestWorkspaceUtil';
import { WorkspaceHandlingTests } from '../../testsLibrary/WorkspaceHandlingTests';
import { ProjectAndFileTests } from '../../testsLibrary/ProjectAndFileTests';
import { Dashboard } from '../../pageobjects/dashboard/Dashboard';

const driverHelper: DriverHelper = e2eContainer.get(CLASSES.DriverHelper);
const ide: Ide = e2eContainer.get(CLASSES.Ide);
const quickOpenContainer: QuickOpenContainer = e2eContainer.get(CLASSES.QuickOpenContainer);
const editor: Editor = e2eContainer.get(CLASSES.Editor);
const topMenu: TopMenu = e2eContainer.get(CLASSES.TopMenu);
const gitHubUtils: GitHubUtil = e2eContainer.get<GitHubUtil>(CLASSES.GitHubUtil);
const projectTree: ProjectTree = e2eContainer.get(CLASSES.ProjectTree);
const gitPlugin: GitPlugin = e2eContainer.get(CLASSES.GitPlugin);
const workspaceHandlingTests: WorkspaceHandlingTests = e2eContainer.get(CLASSES.WorkspaceHandlingTests);
const projectAndFileTests: ProjectAndFileTests = e2eContainer.get(CLASSES.ProjectAndFileTests);
const testWorkspaceUtil: ITestWorkspaceUtil = e2eContainer.get<ITestWorkspaceUtil>(TYPES.WorkspaceUtil);
const dashboard: Dashboard = e2eContainer.get(CLASSES.Dashboard);
const committedFile = 'README.md';

const projectName: string = 'TestRepo';
const fileName: string = 'README.md';
const workspaceName: string = 'python-hello-world';
const stackName: string = 'Python';
const sshKeyName: string = 'git-ssh';

suite('Git with ssh workflow', async () => {
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
        const publicSshKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC3F5RRp92qHSBk72wGGFLRKBQ8N+WhRvIeca1c8HkJJRMzZvc9jBDaz2gMwSLfg/rmeMseJVT7QvI6vmBYA0UqlOgjt/S3nOQCxl5WbLGDsOhDHjeEuhaSOM+KaqHewLf7srGQEfzZlXhMrhxB0sM+JU/gMbCf2aNg5zh/xm5Zeu87w3XX6wMXAZx7Iwah0tDLednnsNEmCppKQGRNZLu7awDV5fX3TIYD+G4xpq+WduGaqOoMOmG/OANomDkAkWKkcPPz8mppfQr7lCeJK1uPYMLxSROkPrvfYzTXN4MzeC55HEHVVane6JB5iBTPJDhMrSTyfkhfL65xtj1hRVZYSnibdlLKJ7/WuF5gjP3C6hEAKIiQP/88ewLQc8jgMl/3XxUgDi1E7z7M18n1TjyH8jPpvrE97AEHSRBPi9GhZUIG7bBJhhRZLQl6gYvOVqXtZ9223AvYRBcayE4GpSFn0V/hkMloOG+Ik97vftr5GpDrtAy/hX9lMulds9j7gHJZy9DmbONzM/VD92XAB5+2bzH5qotGWZwmXoCTt2URsOcDKglzuUWnTJksKx8H/gGqGgyHP3TxFkkYNptJp/Da6krxy0Kj3ogyBgpGiqESRnRKqjMCOn9+cL5eBiu3UV6JgZ0Jo1QT82cTAMlZ0skUxOToR/TD6Eyp6d/pMX7tIw== root@workspace413ca643206e4b6d-5649c4f894-f9prj';

        console.log('>>' + publicSshKey + '<<');
        await gitHubUtils.addPublicSshKeyToUserAccount(TestConstants.TS_GITHUB_TEST_REPO_ACCESS_TOKEN, sshKeyName, publicSshKey);
        await cloneTestRepo();
        await driverHelper.wait(TimeoutConstants.TS_IMPORT_PROJECT_DEFAULT_POLLING);
    });

    test('Change commit and push', async function changeCommitAndPushFunc() {
        const currentDate: string = Date.now().toString();
        await projectTree.expandPathAndOpenFile(projectName, committedFile);
        await editor.type(committedFile, currentDate + '\n', 1);
        await gitPlugin.openGitPluginContainer();
        await gitPlugin.waitChangedFileInChagesList(committedFile);
        await gitPlugin.stageAllChanges(committedFile);
        await gitPlugin.waitChangedFileInChagesList(committedFile);
        await gitPlugin.typeCommitMessage(this.test!.title + currentDate);
        await gitPlugin.commitFromCommandMenu();
        await gitPlugin.pushChangesFromCommandMenu();
        await gitPlugin.waitDataIsSynchronized();
        await driverHelper.wait(TimeoutConstants.TS_EDITOR_TAB_INTERACTION_TIMEOUT);
        const rawDataFromFile: string = await gitHubUtils.getRawContentFromFile(TestConstants.TS_GITHUB_TEST_REPO + '/master/' + committedFile);
        assert.isTrue(rawDataFromFile.includes(currentDate));

        await testWorkspaceUtil.stopAndDeleteWorkspaceByName(workspaceName);
        await dashboard.openDashboard();
    });

    workspaceHandlingTests.createAndOpenWorkspace(stackName);
    projectAndFileTests.waitWorkspaceReadiness(workspaceName, fileName);

    test('Check ssh key in  a new workspace', async () => {
        await cloneTestRepo();
        await projectTree.expandPathAndOpenFile(projectName, committedFile);

        await testWorkspaceUtil.stopAndDeleteWorkspaceByName(workspaceName);
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
