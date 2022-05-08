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
  const tabs = document.getElementById('tabs') 
  for (tab of tabs.children) {
    getVersions(tab.id)
    //eventually pull open tabs from previous session, with the corrected "selected" option for each
  }
  
})

const getVersions = async (tabId=1,selected='2translation') => { // selected param should be an id+source type 
  const query = `select name, id, 'source' as type from sources s
  union select name, id, 'translation' as type from translations t 
  order by type desc, id;`
  await db.all(query, async (err, rows) => {
    var output = ''
    for (row of rows) {
      output += `<option value="${row.id}" type="${row.type}" ${row.id+row.type == selected ? 'selected' : ''}>${row.name}</option>`
    }
    display(tabId, output)
  });
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
  return rtn
}

//joins rows from db
const joinVerses = async (rows, delimiter=' ') => {
  output = ''
  for (let row of rows) {
    output += `<b>${row.verse}.</b> ${delimiter}${row.verse_text}<br><br>`
  }
  return output||'<i>Passage unavailable for the selected Bible.</i>'
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
    for (element of document.getElementById('tabs').children) {
      getTranslationText(element.id, payload)
    }
    display('bible-header',`${payload.book} ${payload.chapter}`)
  });
}

const buildQuery = async (payload) => {
  queries = {
    'translation': `select 
      verse_text, 
      verse
    from books b 
    inner join ${payload.type}_text t
      on t.book = b.id
    where b.name = '${payload.book}'
      and t.${payload.type}_id = ${payload.typeId}
      and t.chapter = ${payload.chapter};`,
    'source': `select 
      group_concat(word||COALESCE(punctuation,''),' ') as verse_text, 
      verse
    from books b 
    inner join ${payload.type}_text t
      on t.book = b.id
    where b.name = '${payload.book}'
      and t.${payload.type}_id = ${payload.typeId}
      and t.chapter = ${payload.chapter}
    group by verse;`
  }
  return queries[payload.type]
}

const getTranslationText = async (id, payload) => {
  const select = document.getElementById(id)
  const selectedIndex = select.selectedIndex
  payload.typeId = select[selectedIndex].value//document get chosen translation
  payload.type = select[selectedIndex].getAttribute('type')
  payload.translation = select[selectedIndex].text
  
  const query = await buildQuery(payload)

  //in future, query book name first based off abbreviation
  await db.all(query, async (err, rows) => {
    //everything you wanna do with the data returned has to go in here
    //if (rows.length < 1) return
    const output = `<h2>${payload.translation}</h2>` + await joinVerses(rows,' ')
    display('tab'+id, output)
  });
}



// These functions are exposed for calling from front end
contextBridge.exposeInMainWorld('DB', {
  getPassage: (selector,searchText) => {
    getBook(selector,searchText)
  }
})

