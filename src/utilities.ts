import * as path from 'path';
import * as fs from 'fs';

export function findCsProjFile(p: string) {
    for (let n = 0; n < 10; n++) {

        let pathContent = fs.readdirSync(p, { withFileTypes: true });
        for (let i = 0; i < pathContent.length; i++) {
            var pathItem = pathContent[i];
            if (pathItem.isDirectory()) {
                continue;
            }

            if (pathItem.name.endsWith('.csproj')) {
                return p;
            }
        }

        p = path.join(p, '..');
    }

    return undefined;
}


export function generateNamespace(projectPath: string, currentPath: string) {
    const rootNamespace = projectPath.substr(projectPath.lastIndexOf(path.sep));
    let namespace = rootNamespace + currentPath.replace(projectPath, '');

    const pathSepRegEx = new RegExp(`\\${path.sep}`, 'g');

    namespace = namespace.replace(pathSepRegEx, '.');
    namespace = namespace.replace(/\s+/g, "_");
    namespace = namespace.replace(/-/g, "_");
    if (namespace.startsWith('.')) {
        namespace = namespace.substr(1);
    }

    return namespace;
}