const helper = require('./helper')
const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./bible.db');

const getText = async (id, payload) => {
  joinFunc = {
    "translation": helper.joinVerses,
    "source": helper.joinWords
  }

  const query = await helper.buildQuery(payload)
  await db.all(query, async (err, rows) => {
    //everything you wanna do with the data returned has to go in here
    const output = document.createElement('div')

    const head = document.createElement('h2')
    head.innerHTML = payload.fullTextName.toUpperCase()
    output.appendChild(head)
    const tab = await joinFunc[payload.type](rows)
    const fontSize = Number(document.getElementById('font-size').innerText)
    tab.style.fontSize = fontSize+'pt'
    output.appendChild(tab)
    output.innerHTML += `<label>${payload.fullTextName}</label><br>LICENSE: <i>${payload.license||'Public Domain'}</i>`
    await helper.displayTag('tab'+id, output)
    
    for (word of document.getElementById('tab'+id).getElementsByClassName('word')) {
      word.addEventListener('click', (event) => { console.log(event.target.getAttribute('value')) })
    }
  });
}

const getTextInfo = async (id, searchPayload) => {
  let payload = {searchPayload}
  //!payload.id = id
  const select = document.getElementById(id)
  const selectedIndex = select.selectedIndex
  payload.typeId = select[selectedIndex].value//document get chosen translation
  payload.type = select[selectedIndex].getAttribute('type')
  payload.textName = select[selectedIndex].text
  
  const queries = {
    'translation': `select 
      full_name, 
      license
    from translations t
    where id = ${payload.typeId};`,
    'source': `select 
      full_name,
      'Public Domain' as license
    from sources s 
    where s.id = ${payload.typeId};`
  }
  await db.all(queries[payload.type], async (err, rows) => {
    payload.fullTextName = rows[0].full_name
    payload.license = rows[0].license
    getText(id, payload)
  });
}

const getBook = async (searchText, displayAreas=document.getElementById('tabs').children) => {
  const searchPayload = await helper.parseSearchQuery(searchText)
  const query = `select 
    name
  from books b 
  where b.name like '${searchPayload.book}%'
  limit 1
  ;`
  await db.all(query, async (err, rows) => {
    //everything you wanna do with the data returned has to go in here
    if (rows.length < 1) return
    searchPayload.book = rows[0].name
    for (element of displayAreas) {
      getTextInfo(element.id, searchPayload)
    }
    helper.display('bible-header',`${searchPayload.book} ${searchPayload.chapter}`)
  });
}

const getVersions = async (tabId,selected='2translation') => { // selected param should be an id+source type 
  const query = `select name, id, 'source' as type from sources s where complete
  union select name, id, 'translation' as type from translations t where complete
  order by type desc, id;`
  getBook('')
  await db.all(query, async (err, rows) => {
    var output = ''
    for (row of rows) {
      if (row.id == 1) output+= `<optgroup label="${row.type[0].toUpperCase()+row.type.slice(1)}:">`
      output += `<option value="${row.id}" type="${row.type}" ${row.id+row.type == selected ? 'selected' : ''}>${row.name}</option>`
    }
    helper.display(tabId, output)
  });
}

module.exports = {
  'getBook': getBook,
  'getVersions': getVersions
}