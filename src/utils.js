import fs from 'bare-fs';
import path from 'bare-path';

export function printAsciiArt() {
    console.log(
        '  _     _       _                                     \n',
        '| |   (_)     | |                                    \n',
        '| |__  _ _ __ | |_ ___ _ __   ___   ___ ___  _ __ ___ \n',
        '| \'_ \\| | \'_ \\| __/ _ \\ \'__| |___| / __/ _ \\| \'__/ _ \\\n',
        '| | | | | | | | ||  __/ |         | (_| (_) | | |  __/\n',
        '|_| |_|_|_| |_|\\__\\___|_|          \\___\\___/|_|  \\___|\n',
        '                                                     \n'
    );
}

export function calculateDirectorySize(dirPath) {
    let totalSize = 0;

    function traverse(currentPath) {
        const items = fs.readdirSync(currentPath);
        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
                traverse(itemPath);
            } else {
                totalSize += stats.size;
            }
        }
    }

    traverse(dirPath);
    return totalSize;
}