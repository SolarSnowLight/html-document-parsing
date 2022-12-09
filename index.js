const fs = require('fs');                
const jsdom = require("jsdom");                
const { parse } = require('node-html-parser');  
const requrest = require('request');
const fsExtra = require('fs-extra');

/* Константы адресов */
const BASE_URL = 'https://pkgh.edu.ru';
const BASE_URL_HTTP = 'http://pkgh.edu.ru';
const GOV_SPB = '//esir.gov.spb.ru';
const GOOGLE_URL = 'www.google.com';
const URL = 'https://pkgh.edu.ru/spetsialnosti/teplosnabzhenie-i-teplotekhnicheskoe-oborudovanie.html';

/* Константы типов доступных файлов */
const includesList = [
    '.css',
    '.scss',
    '.js',
    '.ico',
    '.jpg',
    '.jpeg',
    '.png',
    '.svg',
    '.bmp',
    '.CSS',
    '.SCSS',
    '.JS',
    '.ICO',
    '.JPG',
    '.JPEG',
    '.PNG',
    '.SVG',
    '.BMP',
];

/* Константы типов доступных файлов с ? */
const includesListQ = [
    '.css?',
    '.scss?',
    '.js?',
    '.ico?',
    '.jpg?',
    '.jpeg?',
    '.png?',
    '.svg?',
    '.bmp?'
];

/* Выполнение запроса на сайт (GET) */
requrest(URL, async function (err, res, body) {
    if (err) throw err;

    // Парсинг всей полученной HTML-страницы
    const dom = parse(body);

    // Получение интересующего контента (содержимое для интегрирования)
    const mainBody = dom.querySelector('.content-texture');

    // Получение тела HTML-документа
    const valueBody = dom.querySelector('body');

    var child = valueBody.lastChild;
    var fileBodyElements = [];

    while (child) {
        if ((child.tagName === 'SCRIPT')
            || (child.tagName === 'LINK')) {
            fileBodyElements.push(child);
        }

        // Удаление всех сторонних блоков из тега body
        valueBody.removeChild(child);
        child = valueBody.lastChild;
    }

    valueBody.appendChild(mainBody);
    fileBodyElements.forEach((item) => {
        // Изменение пути в LINK и HEADER
        /*const itemClone = item.clone();

        let relativePath = '';
        if (item.tagName === 'LINK') {
            relativePath = item.getAttribute('href');
            if (relativePath) {
                itemClone.setAttribute('href', relativePath.split('?')[0]);
            }
        } else if ((item.tagName === 'SCRIPT') || (item.tagName === 'IMG')) {
            relativePath = item.getAttribute('src');
            if (relativePath) {
                itemClone.setAttribute('src', relativePath.split('?')[0]);
            }
        }*/

        valueBody.appendChild(item);
    });

    dom.removeChild(dom.querySelector('body'));
    dom.appendChild(valueBody);


    // Загрузка всего документа в файл
    fs.writeFileSync('output.html', body);
    // Загрузка интересующих данных в файл
    fs.writeFileSync('output1.html', dom.toString());


    // Получение HTML-элемента
    const htmlDom = dom.childNodes[1];

    // Поиск элемента HEAD
    const headIndex = htmlDom.childNodes.findIndex((node) => {
        return (node && node.tagName == 'HEAD');
    });

    // Элемент HEAD
    const headElement = htmlDom.childNodes[headIndex];
    const newHeadElement = headElement.clone();

    newHeadElement.removeChild(newHeadElement.querySelector('base'));
    let childHeader = newHeadElement.lastChild;
    let otherTags = [];

    while (childHeader) {
        if ((childHeader.tagName !== 'SCRIPT')
            && (childHeader.tagName !== 'LINK')) {
            otherTags.push(childHeader);
        }

        // Удаление всех сторонних блоков из тега header
        newHeadElement.removeChild(childHeader);
        childHeader = newHeadElement.lastChild;
    }

    otherTags.forEach((item) => {
        newHeadElement.appendChild(item);
    });

    const titleIndex = headElement.childNodes.findIndex((node) => {
        return (node && node.tagName === 'TITLE');
    });

    const nameDir = `/${headElement.childNodes[titleIndex].textContent.replace('-', '')}`;

    if (!fsExtra.existsSync(nameDir)) {
        fsExtra.mkdirSync(nameDir);
    }

    let fileHeaderElements = [];

    headElement.childNodes.forEach((item) => {
        if ((item.tagName === 'LINK')
            || (item.tagName === 'SCRIPT')
            || (item.tagName === 'IMG')) {
            fileHeaderElements.push(item);

            /*const itemClone = item.clone();

            let relativePath = '';
            if (item.tagName === 'LINK') {
                relativePath = item.getAttribute('href');
                if (relativePath) {
                    itemClone.setAttribute('href', relativePath.split('?')[0]);
                }
            } else if ((item.tagName === 'SCRIPT') || (item.tagName === 'IMG')) {
                relativePath = item.getAttribute('src');
                if (relativePath) {
                    itemClone.setAttribute('src', relativePath.split('?')[0]);
                }
            }

            newHeadElement.appendChild(itemClone);*/
        }
    });

    /*htmlDom.removeChild(dom.querySelector('head'));
    htmlDom.appendChild(newHeadElement);

    dom.removeChild(dom.querySelector('html'));
    dom.appendChild(htmlDom);*/

    /*fileElements.forEach((item) => {
        if(item.tagName === 'LINK'){
            console.log(item.getAttribute('href'));
        }else if(item.tagName === 'SCRIPT'){
            console.log(item.getAttribute('src'));
        }
    });*/

    fileHeaderElements = fileHeaderElements.concat(fileBodyElements);
    fileHeaderElements.forEach((item) => {
        let relativePath = '';
        if (item.tagName === 'LINK') {
            relativePath = item.getAttribute('href');
        } else if ((item.tagName === 'SCRIPT') || (item.tagName === 'IMG')) {
            relativePath = item.getAttribute('src');
        }

        if ((relativePath !== undefined)
            && (relativePath != null)) {
            let files = relativePath.split('//');
            const pathLast = files[files.length - 1];
            let check = false;

            for (let i = 0; i < includesList.length; i++) {
                if (pathLast.includes(includesList[i]) && (!pathLast.includes(GOOGLE_URL))) {
                    check = true;
                    break;
                }
            }

            if (check) {
                if ((!relativePath.includes('http'))
                    && (!relativePath.includes('https'))
                    && (!relativePath.includes(GOV_SPB))) {
                    relativePath = `${BASE_URL}${relativePath}`;
                }

                if (relativePath.includes(GOV_SPB)) {
                    relativePath = relativePath.replace(GOV_SPB, `https:${GOV_SPB}`);
                }

                console.log(relativePath);
                if (relativePath.length > 0) {
                    requrest(relativePath, async function (err, res, body) {
                        if (err) throw err;

                        relativePath = relativePath.replace(BASE_URL, '')
                            .replace(BASE_URL_HTTP, '')
                            .replace(`https:${GOV_SPB}`, '');
                        fsExtra.outputFileSync(__dirname + nameDir + relativePath.split('?')[0], body);
                    });
                }
            }
        }
    });

    /*htmlDom[headIndex].childNodes.forEach((item) => {
        console.log(item.tagName);
    });*/
});
