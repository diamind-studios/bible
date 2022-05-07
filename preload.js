const {contextBridge} = require('electron')
const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./bible.db');

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.


// This runs after DOM loads

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  //select all the translations and sources and add them to the selectors
  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})


const reset = async (selector) => {
  const element = document.getElementById(selector)
  if (element) element.innerText = ''
}

const display = async (selector, text) => {
  const element = document.getElementById(selector)
  if (element) element.innerHTML = text
}

const parseQuery = async (searchText) => {
  searchText = searchText.split(' ')
  let rtn = {}
  rtn.book = searchText.slice(0,searchText.length-1).join(' ')
  rtn.chapter = searchText.slice(searchText.length-1).join(' ').split(':')[0]||'1'
  rtn.verse = searchText.slice(searchText.length-1).join(' ').split(':')[1]||'1'
  rtn.type = 'translation'//document get chosen translation
  rtn.id = '2'//document get chosen translation
  return rtn
}

//joins rows from db
const joinVerses = async (rows, delimiter=' ') => {
  output = ''
  for (let row of rows) {
    output += `<b>${row.verse}</b>${delimiter}${row.verse_text}<br><br>`
  }
  return output
}

const getBook = async (id, searchText) => {
  const payload = await parseQuery(searchText)
  payload.query = `select 
    name
  from books b 
  where b.name like '${payload.book}%'
  limit 1
  ;`
  //in future, query book name first based off abbreviation
  await db.all(payload.query, async (err, rows) => {
    //everything you wanna do with the data returned has to go in here
    if (rows.length < 1) return
    payload.book = rows[0].name
    getText(id, payload)
    display('bible-header',`${payload.book} ${payload.chapter}`)
  });
}

const getText = async (id, payload) => {
  payload.query = `select 
    verse_text, 
    verse
  from books b 
  inner join ${payload.type}_text t
    on t.book = b.id
  where b.name like '${payload.book}'
    and t.${payload.type}_id = ${payload.id}
    and t.chapter = ${payload.chapter};`
  //in future, query book name first based off abbreviation
  await db.all(payload.query, async (err, rows) => {
    //everything you wanna do with the data returned has to go in here
    if (rows.length < 1) return
    const output = await joinVerses(rows,' ')
    display(id, output)
  });
}



// These functions are exposed for calling from front end
contextBridge.exposeInMainWorld('DB', {
  getPassage: (selector,searchText) => {
    getBook(selector,searchText)
  },
  test(dataPayload) {
    return dataPayload// await getBookNames()
  }
})

