// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//\const sqlite3 = require('sqlite3').verbose();
//var db = new sqlite3.Database('bible.db');
searchText='Genesis 1:1'

function search(event) {
    event.preventDefault();
    searchText = document.getElementById('searchText').value
    if (!searchText) return    
    DB.getPassage(searchText)
  }
  
function newTab() { //create new tab for viewing scripture
    const tabs = document.getElementById('tabs')
    const main = document.getElementById('main')
    const tabCount = tabs.childElementCount
    const tab = createTabElement(tabCount+1)
    tabs.appendChild(tab)
    //tabs.innerHTML += `<select id="${tabCount+1}" class="tab"></select>`

    main.innerHTML += `<div id="tab${tabCount+1}" class="tabBody"></div>`
    if ((tabCount+1) * 40 > 100) {
        main.style.width = `${(tabCount+1) * 50}%`
    } else {
        main.style.width = '100%'
    }
    DB.newTab(tabCount+1)
}

function reselect(event) {
    DB.getPassage(searchText,[event.target])
}

function createTabElement(id) {
    let tab = document.createElement('select')
    tab.id = `${id}`
    tab.class = 'tab'
    tab.addEventListener('change', reselect)

    return tab
}

document.getElementById('1').addEventListener('change', reselect)
document.getElementById("search-form").addEventListener("submit", search);
document.getElementById("newtab").addEventListener("click", newTab, false);