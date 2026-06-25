let fileText = "";

/* ------------------------- */
/* نرمال سازی متن فارسی */
/* ------------------------- */

function normalizeText(text){

    return text

        .replace(/ي/g,"ی")
        .replace(/ك/g,"ک")
        .replace(/\u200c/g,"")
        .replace(/\r/g,"")
        .trim();

}

/* ------------------------- */
/* بارگذاری خودکار فایل آنلاین */
/* ------------------------- */

async function loadWordsFromServer(){

    try{

        const response =
        await fetch("./data/words.txt");

        if(!response.ok){

            throw new Error(
                "خطا در دریافت فایل"
            );

        }

        fileText =
        normalizeText(
            await response.text()
        );

        document
        .getElementById("fileName")
        .textContent =
        "✓ واژگان پیش‌فرض بارگذاری شد";

    }

    catch(error){

        console.error(error);

        document
        .getElementById("fileName")
        .textContent =
        "✗ خطا در بارگذاری words.txt";

    }

}

/* ------------------------- */
/* انتخاب فایل شخصی */
/* ------------------------- */

async function openFile(){

    try{

        const [handle] =
        await window.showOpenFilePicker({

            types:[

                {

                    description:"Text Files",

                    accept:{
                        "text/plain":[".txt"]
                    }

                }

            ]

        });

        const file =
        await handle.getFile();

        await loadCustomFile(file);

    }

    catch(err){

        console.log(err);

    }

}

/* ------------------------- */
/* فایل شخصی */
/* ------------------------- */

async function loadCustomFile(file){

    fileText =
    normalizeText(
        await file.text()
    );

    document
    .getElementById("fileName")
    .textContent =
    "✓ فایل شخصی فعال است: "
    + file.name;

    runSearch();

}

/* ------------------------- */
/* شمارش حروف */
/* ------------------------- */

function countLetters(text){

    const counter = {};

    const letters =
    text.match(
        /[\p{L}\p{N}]/gu
    ) || [];

    for(const ch of letters){

        const c =
        ch.toLowerCase();

        counter[c] =
        (counter[c] || 0) + 1;

    }

    return counter;

}

/* ------------------------- */
/* تبدیل متن به کلمات */
/* ------------------------- */

function tokenize(text){

    return normalizeText(text)

    .replace(
        /[^\p{L}\p{N}\s]/gu,
        " "
    )

    .split(/\s+/)

    .filter(Boolean);

}

/* ------------------------- */
/* فیلتر کلمات مجاز */
/* ------------------------- */

function onlyAllowed(
    words,
    allowed
){

    const result = [];

    for(const word of words){

        const w =
        normalizeText(
            word.toLowerCase()
        );

        const counts = {};

        let valid = true;

        for(const ch of w){

            if(!(ch in allowed)){

                valid = false;
                break;

            }

            counts[ch] =
            (counts[ch] || 0) + 1;

            if(
                counts[ch]
                >
                allowed[ch]
            ){

                valid = false;
                break;

            }

        }

        if(valid){

            result.push(word);

        }

    }

    return [...new Set(result)];

}

/* ------------------------- */
/* گروه بندی بر اساس طول */
/* ------------------------- */

function groupByLength(words){

    const groups = {};

    for(const word of words){

        const len =
        word.length;

        if(!groups[len]){

            groups[len] = [];

        }

        groups[len]
        .push(word);

    }

    return groups;

}

/* ------------------------- */
/* جدول نتایج */
/* ------------------------- */

function buildTable(groups){

    const lengths =

    Object.keys(groups)

    .map(Number)

    .sort((a,b)=>a-b);

    if(lengths.length===0){

        return `
        <div class="no-result">
            هیچ کلمه‌ای پیدا نشد
        </div>
        `;

    }

    let maxRows = 0;

    lengths.forEach(len=>{

        maxRows =

        Math.max(
            maxRows,
            groups[len].length
        );

    });

    let html =
    "<table>";

    html += "<tr>";
    html += "<th>ردیف</th>";

    lengths.forEach(len=>{

        html +=
        `<th>${len}</th>`;

    });

    html += "</tr>";

    for(let i=0;i<maxRows;i++){

        html += "<tr>";

        html +=
        `<td>${i+1}</td>`;

        lengths.forEach(len=>{

            html += `
            <td>
                ${groups[len][i] || ""}
            </td>
            `;

        });

        html += "</tr>";

    }

    html += "</table>";

    return html;

}

/* ------------------------- */
/* جستجو */
/* ------------------------- */

function runSearch(){

    if(!fileText){

        return;

    }

    const letters =

    normalizeText(

        document
        .getElementById("letters")
        .value

    );

    if(!letters){

        document
        .getElementById("result")
        .innerHTML = "";

        return;

    }

    const minLen =

    parseInt(

        document
        .getElementById("minLen")
        .value

    );

    const allowed =
    countLetters(letters);

    const words =
    tokenize(fileText);

    const filtered =

    onlyAllowed(
        words,
        allowed
    )

    .filter(
        w =>
        w.length >= minLen
    );

    const groups =

    groupByLength(
        filtered
    );

    document
    .getElementById("result")
    .innerHTML =

    `
    <div class="stats">
        تعداد کلمات یافت شده:
        <b>${filtered.length}</b>
    </div>
    `
    +
    buildTable(groups);

}

/* ------------------------- */
/* Drag & Drop */
/* ------------------------- */

const dropZone =
document.getElementById(
    "dropZone"
);

dropZone.addEventListener(

    "dragover",

    e=>{

        e.preventDefault();

        dropZone.classList.add(
            "dragover"
        );

    }

);

dropZone.addEventListener(

    "dragleave",

    ()=>{

        dropZone.classList.remove(
            "dragover"
        );

    }

);

dropZone.addEventListener(

    "drop",

    async e=>{

        e.preventDefault();

        dropZone.classList.remove(
            "dragover"
        );

        const file =
        e.dataTransfer.files[0];

        if(
            file &&
            file.name
            .toLowerCase()
            .endsWith(".txt")
        ){

            await loadCustomFile(
                file
            );

        }

    }

);

/* ------------------------- */
/* رویدادها */
/* ------------------------- */

document
.getElementById("pickFile")
.addEventListener(
    "click",
    openFile
);

document
.getElementById("letters")
.addEventListener(
    "input",
    runSearch
);

document
.getElementById("minLen")
.addEventListener(
    "change",
    runSearch
);

/* ------------------------- */
/* شروع برنامه */
/* ------------------------- */

window.addEventListener(

    "load",

    async ()=>{

        await loadWordsFromServer();

    }

);