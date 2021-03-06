import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { findCsProjFile, generateNamespace } from './utilities';

const ignoredDirectories = [
    'obj',
    'bin',
    'node_modules',
    '.git',
    '.vscode',
    '.vs',
    '.github'
];

let _lastSelectedPath = '';

export class FileCreator {
    public async createClass() {
        await promptFileCreation('class');
    }

    public async createInterface() {
        await promptFileCreation('interface');
    }

    public async createEnum() {
        await promptFileCreation('enum');
    }

    public async createTest() {
        await promptFileCreation('test');
    }
}

async function promptFileCreation(fileType: string) {
    if (_lastSelectedPath == '') {
        const activeDoc = vscode.window.activeTextEditor?.document;
        if (typeof activeDoc !== 'undefined') {
            _lastSelectedPath = path.dirname(activeDoc.fileName);
        }
        else {
            _lastSelectedPath = vscode.workspace.rootPath!;
        }
    }

    const selectedPath = await promptForPath();
    if (typeof selectedPath === 'undefined') {
        return;
    }
    const projPath = findCsProjFile(selectedPath);
    if (typeof projPath === 'undefined') {
        vscode.window.showErrorMessage('Failed to find C# project.');
        return;
    }

    const namespace = generateNamespace(projPath, selectedPath);
    if (typeof namespace === 'undefined') {
        vscode.window.showErrorMessage('Failed to generate namespace.');
        return;
    }

    const className = await vscode.window.showInputBox({ ignoreFocusOut: true, prompt: 'Please enter class name.' });
    if (typeof className === 'undefined') {
        return;
    }

    const filename = path.join(selectedPath, className + '.cs');
    await createFile(filename, fileType, className, namespace);
    const doc = await vscode.workspace.openTextDocument(filename);
    await vscode.window.showTextDocument(doc);

    _lastSelectedPath = selectedPath;
}

async function createFile(filename: string, templateName: string, objectName: string, namespace: string) {
    const doc = await vscode.workspace.openTextDocument(vscode.extensions.getExtension('roadsidejesus.csharp-helper')!.extensionPath + '/templates/' + templateName + '.txt')

    let text = doc.getText();
    text = text.replace('$namespace', namespace);
    text = text.replace(/\$name/g, objectName);

    fs.writeFileSync(filename, text);
}

async function promptForPath(): Promise<string | undefined> {
    let pathInput = _lastSelectedPath;
    while (true) {
        let pathSelectionArray = getDirectories(pathInput);
        let quickPickItems: vscode.QuickPickItem[] = [];
        if (pathInput != vscode.workspace.rootPath) {
            quickPickItems.push(<vscode.QuickPickItem>{
                label: '..',
                description: path.join(pathInput, '..')
            });
        }
        quickPickItems.push(<vscode.QuickPickItem>{
            label: '.',
            description: pathInput
        });

        pathSelectionArray.forEach(p => {
            quickPickItems.push(<vscode.QuickPickItem>{
                label: p
            });
        });

        const selection = await vscode.window.showQuickPick(quickPickItems);
        if (typeof selection === 'undefined') {
            return;
        }

        if (selection.label === '.') {
            return pathInput;
        }
        else if (selection.label === '..') {
            pathInput = path.join(pathInput, '..');
        }
        else {
            pathInput = path.join(pathInput, selection.label);
        }
    }
}

function getDirectories(p: string) {

    let directories = [];

    let pathContent = fs.readdirSync(p, { withFileTypes: true });
    for (let i = 0; i < pathContent.length; i++) {
        var pathItem = pathContent[i];
        if (ignoredDirectories.includes(pathItem.name)) {
            continue;
        }

        if (pathItem.isDirectory()) {
            directories.push(pathContent[i].name);
        }
    }

    return directories;
}