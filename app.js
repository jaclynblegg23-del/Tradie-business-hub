function showPanel(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));

  const el=document.getElementById('panel-'+name);
  if(el) el.classList.remove('hidden');

  document.querySelectorAll('.side').forEach(s=>s.classList.remove('active'));

  document.querySelectorAll('.side').forEach(s=>{
    if(s.textContent.toLowerCase().includes(name==='dashboard'?'dashboard':name)){
      s.classList.add('active');
    }
  });

  document.getElementById('dashboard')?.scrollIntoView({
    behavior:'smooth',
    block:'start'
  });
}

function money(n){
  return new Intl.NumberFormat('en-AU',{
    style:'currency',
    currency:'AUD'
  }).format(Number(n)||0);
}

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g,char=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[char]));
}

/* =========================
   QUOTE BUILDER
========================= */

function setupQuoteBuilder(){
  const panel=document.getElementById('panel-quote');
  if(!panel)return;

  panel.innerHTML=`
    <div class="panel-head">
      <div>
        <div class="eyebrow">QUOTES</div>
        <h2>Create a professional quote</h2>
      </div>
    </div>

    <div class="form-card">

      <h3>Quote details</h3>

      <div class="form-grid">

        <label>
          Quote number
          <input id="qnumber" value="QT-1001">
        </label>

        <label>
          Quote date
          <input id="qdate" type="date">
        </label>

        <label>
          Valid until
          <input id="qvalid" type="date">
        </label>

        <label>
          Customer name
          <input id="qcustomer" placeholder="Customer name">
        </label>

        <label>
          Customer email
          <input id="qemail" type="email" placeholder="customer@email.com">
        </label>

        <label>
          Job address
          <input id="qaddress" placeholder="Job address">
        </label>

      </div>

      <label>
        Job description
        <textarea id="qdesc" rows="3" placeholder="Describe the work to be completed"></textarea>
      </label>

      <div class="section-row">
        <h3>Quote items</h3>
        <span class="muted">All prices are entered ex GST</span>
      </div>

      <div class="quote-item quote-item-head">
        <span>Description</span>
        <span>Qty</span>
        <span>Rate</span>
        <span></span>
      </div>

      <div id="quote-items"></div>

      <button
        type="button"
        class="secondary-action"
        onclick="addQuoteItem()">
        + Add line item
      </button>

      <label class="checkbox-row">
        <input id="qgst" type="checkbox" checked>
        Include 10% GST
      </label>

      <label>
        Notes to customer
        <textarea id="qnotes" rows="3" placeholder="Additional information"></textarea>
      </label>

      <label>
        Payment / quote terms
        <textarea id="qterms" rows="3" placeholder="Example: 50% deposit required before work commences."></textarea>
      </label>

      <div class="quote-actions">

        <button
          class="btn btn-primary"
          onclick="previewQuote()">
          Preview Quote
        </button>

        <button
          type="button"
          class="secondary-action"
          onclick="saveQuoteDraft()">
          Save Draft
        </button>

        <button
          type="button"
          class="secondary-action"
          onclick="resetQuote()">
          Clear
        </button>

      </div>

      <div id="quote-result"></div>

    </div>
  `;

  setQuoteDates();
  addQuoteItem();
  document.getElementById('qgst').addEventListener(
    'change',
    calculateQuoteTotal
  );
  loadQuoteDraft();
}

function setQuoteDates(){

  const today=new Date();

  const todayString=new Date(
    today.getTime()-today.getTimezoneOffset()*60000
  ).toISOString().slice(0,10);

  const valid=new Date(today);

  valid.setDate(valid.getDate()+14);

  const validString=new Date(
    valid.getTime()-valid.getTimezoneOffset()*60000
  ).toISOString().slice(0,10);

  document.getElementById('qdate').value=todayString;
  document.getElementById('qvalid').value=validString;
}

function addQuoteItem(data={}){

  const box=document.getElementById('quote-items');

  if(!box)return;

  const row=document.createElement('div');

  row.className='quote-item';

  row.innerHTML=`
    <input
      class="item-desc"
      placeholder="Item or service"
      value="${escapeHtml(data.desc||'')}">

    <input
      class="item-qty"
      type="number"
      value="${data.qty ?? 1}"
      min="0"
      step="1"
      placeholder="Qty">

    <input
      class="item-rate"
      type="number"
      min="0"
      step="0.01"
      placeholder="Rate ex GST"
      value="${data.rate ?? ''}">

    <button
      type="button"
      class="remove-item"
      aria-label="Remove line item"
      onclick="this.parentElement.remove(); calculateQuoteTotal()">
      ×
    </button>
  `;

  box.appendChild(row);

  row.querySelectorAll('input').forEach(input=>{
    input.addEventListener('input',calculateQuoteTotal);
  });

  calculateQuoteTotal();
}

function getQuoteData(){

  const items=[];

  document.querySelectorAll('#quote-items .quote-item').forEach(row=>{

    const desc=row.querySelector('.item-desc')?.value.trim()||'';

    const qty=Number(
      row.querySelector('.item-qty')?.value
    )||0;

    const rate=Number(
      row.querySelector('.item-rate')?.value
    )||0;

    if(desc || rate || qty){
      items.push({
        desc,
        qty,
        rate,
        total:qty*rate
      });
    }
  });

  const subtotal=items.reduce(
    (sum,item)=>sum+item.total,
    0
  );

  const gst=document.getElementById('qgst')?.checked
    ? subtotal*0.10
    : 0;

  return{

    number:
      document.getElementById('qnumber')?.value.trim()
      ||'QT-1001',

    date:
      document.getElementById('qdate')?.value||'',

    valid:
      document.getElementById('qvalid')?.value||'',

    customer:
      document.getElementById('qcustomer')?.value.trim()
      ||'Customer',

    email:
      document.getElementById('qemail')?.value.trim()
      ||'',

    address:
      document.getElementById('qaddress')?.value.trim()
      ||'Job address',

    desc:
      document.getElementById('qdesc')?.value.trim()
      ||'Work',

    items,

    subtotal,

    gst,

    total:subtotal+gst,

    notes:
      document.getElementById('qnotes')?.value.trim()
      ||'',

    terms:
      document.getElementById('qterms')?.value.trim()
      ||''
  };
}

function calculateQuoteTotal(){

  const box=document.getElementById('quote-items');

  if(!box)return;

  let subtotal=0;

  box.querySelectorAll('.quote-item').forEach(row=>{

    const qty=Number(
      row.querySelector('.item-qty')?.value
    )||0;

    const rate=Number(
      row.querySelector('.item-rate')?.value
    )||0;

    subtotal+=qty*rate;
  });

  const gst=document.getElementById('qgst')?.checked
    ? subtotal*0.10
    : 0;

  const total=subtotal+gst;

  let totalBox=document.getElementById(
    'quote-live-total'
  );

  if(!totalBox){

    totalBox=document.createElement('div');

    totalBox.id='quote-live-total';

    totalBox.className='live-total';

    const button=document.querySelector(
      '#panel-quote .secondary-action'
    );

    box.parentElement.insertBefore(
      totalBox,
      button
    );
  }

  totalBox.innerHTML=`
    <span>Estimated total</span>
    <strong>${money(total)}</strong>
  `;
}

function previewQuote(){

  const q=getQuoteData();

  if(!q.items.length){

    document.getElementById(
      'quote-result'
    ).innerHTML=`
      <div class="result error">
        Add at least one quote item before previewing.
      </div>
    `;

    return;
  }

  const items=q.items.map(item=>`
    <tr>
      <td>${escapeHtml(item.desc||'Work')}</td>
      <td>${item.qty}</td>
      <td>${money(item.rate)}</td>
      <td>${money(item.total)}</td>
    </tr>
  `).join('');

  document.getElementById(
    'quote-result'
  ).innerHTML=`

    <div class="result quote-preview">

      <div class="preview-toolbar">

        <div>
          <span class="eyebrow">PREVIEW</span>
          <h2>QUOTE ${escapeHtml(q.number)}</h2>
        </div>

        <button
          type="button"
          class="secondary-action"
          onclick="printQuote()">
          Print / Save PDF
        </button>

        <button
          type="button"
          class="btn btn-primary"
          onclick="convertQuoteToInvoice()">
          Convert to Invoice
        </button>

      </div>

      <div class="preview-customer">

        <strong>${escapeHtml(q.customer)}</strong><br>

        ${
          q.email
          ? `${escapeHtml(q.email)}<br>`
          : ''
        }

        ${escapeHtml(q.address)}

      </div>

      <hr>

      <strong>Quote date:</strong>
      ${escapeHtml(q.date)}

      &nbsp; · &nbsp;

      <strong>Valid until:</strong>
      ${escapeHtml(q.valid)}

      <br><br>

      <strong>Job description</strong><br>
      ${escapeHtml(q.desc)}

      <br><br>

      <div class="table-wrap">

        <table>

          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${items}
          </tbody>

        </table>

      </div>

      <hr>

      <div class="quote-totals">

        <span>Subtotal</span>
        <strong>${money(q.subtotal)}</strong>

        <span>GST</span>
        <strong>${money(q.gst)}</strong>

        <span class="grand-total">Total</span>
        <strong class="grand-total">
          ${money(q.total)}
        </strong>

      </div>

      ${
        q.notes
        ? `
          <hr>
          <strong>Notes</strong>
          <p>${escapeHtml(q.notes).replace(/\n/g,'<br>')}</p>
        `
        : ''
      }

      ${
        q.terms
        ? `
          <hr>
          <strong>Payment / Terms</strong>
          <p>${escapeHtml(q.terms).replace(/\n/g,'<br>')}</p>
        `
        : ''
      }

    </div>
  `;
}

function saveQuoteDraft(){

  const q=getQuoteData();

  localStorage.setItem(
    'tradieHubQuoteDraft',
    JSON.stringify(q)
  );

  document.getElementById(
    'quote-result'
  ).innerHTML=`
    <div class="result success">
      ✓ Quote draft saved on this device.
    </div>
  `;
}

function loadQuoteDraft(){

  try{

    const raw=localStorage.getItem(
      'tradieHubQuoteDraft'
    );

    if(!raw)return;

    const q=JSON.parse(raw);

    document.getElementById('qnumber').value=
      q.number||'QT-1001';

    document.getElementById('qdate').value=
      q.date||'';

    document.getElementById('qvalid').value=
      q.valid||'';

    document.getElementById('qcustomer').value=
      q.customer==='Customer'
      ? ''
      : (q.customer||'');

    document.getElementById('qemail').value=
      q.email||'';

    document.getElementById('qaddress').value=
      q.address==='Job address'
      ? ''
      : (q.address||'');

    document.getElementById('qdesc').value=
      q.desc==='Work'
      ? ''
      : (q.desc||'');

    document.getElementById('qnotes').value=
      q.notes||'';

    document.getElementById('qterms').value=
      q.terms||'';

    document.getElementById('qgst').checked=
      q.gst > 0;

    document.getElementById(
      'quote-items'
    ).innerHTML='';

    (q.items?.length ? q.items : [{}])
      .forEach(addQuoteItem);

  }catch(e){

    localStorage.removeItem(
      'tradieHubQuoteDraft'
    );
  }
}

function resetQuote(){

  localStorage.removeItem(
    'tradieHubQuoteDraft'
  );

  setupQuoteBuilder();
}

function printQuote(){

  const preview=document.querySelector(
    '.quote-preview'
  );

  if(!preview)return;

  const win=window.open(
    '',
    '_blank',
    'width=900,height=700'
  );

  if(!win)return;

  win.document.write(`
    <!doctype html>

    <html>

    <head>

      <title>
        Tradie Business Hub Quote
      </title>

      <style>

        body{
          font-family:Arial,sans-serif;
          padding:40px;
          color:#18231f;
        }

        h2{
          margin:4px 0 20px;
        }

        .eyebrow{
          font-size:12px;
          letter-spacing:1.5px;
          font-weight:700;
        }

        table{
          width:100%;
          border-collapse:collapse;
          margin:20px 0;
        }

        th,td{
          padding:9px;
          border-bottom:1px solid #ddd;
          text-align:left;
        }

        th:nth-child(n+2),
        td:nth-child(n+2){
          text-align:right;
        }

        .quote-totals{
          display:grid;
          grid-template-columns:1fr auto;
          gap:8px;
          max-width:300px;
          margin-left:auto;
        }

        .grand-total{
          font-size:18px;
          font-weight:800;
        }

        button{
          display:none;
        }

        hr{
          border:0;
          border-top:1px solid #ddd;
          margin:20px 0;
        }

      </style>

    </head>

    <body>

      ${preview.innerHTML}

    </body>

    </html>
  `);

  win.document.close();

  win.focus();

  setTimeout(()=>{
    win.print();
  },250);
}

/* =========================
   INVOICES
========================= */

function addInvoiceItem(data={}){

  const box=document.getElementById('invoice-items');

  if(!box)return;

  const row=document.createElement('div');

  row.className='quote-item';

  row.innerHTML=`
    <input class="invoice-item-desc" placeholder="Item or service" value="${escapeHtml(data.desc||'')}">
    <input class="invoice-item-qty" type="number" value="${data.qty ?? 1}" min="0" step="1" placeholder="Qty">
    <input class="invoice-item-rate" type="number" min="0" step="0.01" placeholder="Rate ex GST" value="${data.rate ?? ''}">
    <button type="button" class="remove-item" aria-label="Remove line item" onclick="this.parentElement.remove(); calculateInvoiceTotal()">×</button>
  `;

  box.appendChild(row);

  row.querySelectorAll('input').forEach(input=>{
    input.addEventListener('input',calculateInvoiceTotal);
  });

  calculateInvoiceTotal();
}

function getInvoiceData(){

  const items=[];

  document.querySelectorAll('#invoice-items .quote-item').forEach(row=>{
    const desc=row.querySelector('.invoice-item-desc')?.value.trim()||'';
    const qty=Number(row.querySelector('.invoice-item-qty')?.value)||0;
    const rate=Number(row.querySelector('.invoice-item-rate')?.value)||0;

    if(desc || rate || qty){
      items.push({desc,qty,rate,total:qty*rate});
    }
  });

  const subtotal=items.reduce((sum,item)=>sum+item.total,0);
  const gstIncluded=document.getElementById('igst')?.checked||false;
  const gst=gstIncluded ? subtotal*0.10 : 0;

  return{
    number:document.getElementById('inum')?.value.trim()||getNextInvoiceNumber(),
    customer:document.getElementById('icustomer')?.value.trim()||'Customer',
    email:document.getElementById('iemail')?.value.trim()||'',
    address:document.getElementById('iaddress')?.value.trim()||'Job address',
    reference:document.getElementById('ireference')?.value.trim()||'',
    desc:document.getElementById('idesc')?.value.trim()||'Work',
    items,
    subtotal,
    gstIncluded,
    gst,
    total:subtotal+gst
  };
}

function calculateInvoiceTotal(){

  const box=document.getElementById('invoice-items');

  if(!box)return;

  const subtotal=[...box.querySelectorAll('.quote-item')].reduce((sum,row)=>{
    const qty=Number(row.querySelector('.invoice-item-qty')?.value)||0;
    const rate=Number(row.querySelector('.invoice-item-rate')?.value)||0;
    return sum+(qty*rate);
  },0);

  const gst=document.getElementById('igst')?.checked ? subtotal*0.10 : 0;
  let totalBox=document.getElementById('invoice-live-total');

  if(!totalBox){
    totalBox=document.createElement('div');
    totalBox.id='invoice-live-total';
    totalBox.className='live-total';
    box.parentElement.insertBefore(totalBox,box.nextElementSibling);
  }

  totalBox.innerHTML=`<span>Amount due</span><strong>${money(subtotal+gst)}</strong>`;
}

function getStoredInvoices(){

  try{
    return JSON.parse(localStorage.getItem('tradieHubInvoices')||'[]');
  }catch(e){
    return [];
  }
}

function getNextInvoiceNumber(){

  const numbers=getStoredInvoices().map(invoice=>invoice.number)
    .map(number=>Number(String(number).match(/^INV-(\d+)$/i)?.[1])||0);

  return `INV-${Math.max(1000,...numbers)+1}`;
}

function setupInvoiceBuilder(){

  const panel=document.getElementById('panel-invoice');

  if(!panel || document.querySelector('#invoice-items .quote-item'))return;

  document.getElementById('inum').value=getNextInvoiceNumber();
  addInvoiceItem();
  document.getElementById('igst').addEventListener('change',calculateInvoiceTotal);
}

function saveInvoice(invoice){

  const invoices=getStoredInvoices().filter(item=>item.number!==invoice.number);
  invoices.push(invoice);
  localStorage.setItem('tradieHubInvoices',JSON.stringify(invoices));
}

function populateInvoice(invoice){

  document.getElementById('icustomer').value=invoice.customer==='Customer' ? '' : (invoice.customer||'');
  document.getElementById('iemail').value=invoice.email||'';
  document.getElementById('iaddress').value=invoice.address==='Job address' ? '' : (invoice.address||'');
  document.getElementById('inum').value=invoice.number||getNextInvoiceNumber();
  document.getElementById('ireference').value=invoice.reference||'';
  document.getElementById('idesc').value=invoice.desc==='Work' ? '' : (invoice.desc||'');
  document.getElementById('igst').checked=invoice.gstIncluded ?? invoice.gst>0;

  const box=document.getElementById('invoice-items');
  box.innerHTML='';
  (invoice.items?.length ? invoice.items : [{}]).forEach(addInvoiceItem);
  calculateInvoiceTotal();
}

function convertQuoteToInvoice(){

  const quote=getQuoteData();

  if(!quote.items.length)return;

  const invoice={
    number:getNextInvoiceNumber(),
    customer:quote.customer,
    email:quote.email,
    address:quote.address,
    reference:quote.number,
    desc:quote.desc,
    items:quote.items.map(item=>({...item})),
    subtotal:quote.subtotal,
    gstIncluded:quote.gst>0,
    gst:quote.gst,
    total:quote.total
  };

  saveInvoice(invoice);
  populateInvoice(invoice);
  showPanel('invoice');
  makeInvoice();
}

function makeInvoice(){

  const invoice=getInvoiceData();

  if(!invoice.items.length){
    document.getElementById('invoice-result').innerHTML='<div class="result error">Add at least one invoice item before previewing.</div>';
    return;
  }

  saveInvoice(invoice);

  const items=invoice.items.map(item=>`
    <tr><td>${escapeHtml(item.desc||'Work')}</td><td>${item.qty}</td><td>${money(item.rate)}</td><td>${money(item.total)}</td></tr>
  `).join('');

  document.getElementById(
    'invoice-result'
  ).innerHTML=`

    <div class="result quote-preview invoice-preview">
      <div class="preview-toolbar">
        <div><span class="eyebrow">PREVIEW</span><h2>INVOICE ${escapeHtml(invoice.number)}</h2></div>
        <button type="button" class="secondary-action" onclick="printInvoice()">Print / Save PDF</button>
      </div>
      <div class="preview-customer"><strong>${escapeHtml(invoice.customer)}</strong><br>${invoice.email ? `${escapeHtml(invoice.email)}<br>` : ''}${escapeHtml(invoice.address)}</div>
      ${invoice.reference ? `<p><strong>Quote reference:</strong> ${escapeHtml(invoice.reference)}</p>` : ''}
      <hr>
      <strong>Job description</strong><br>${escapeHtml(invoice.desc)}
      <div class="table-wrap"><table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>${items}</tbody></table></div>
      <hr>
      <div class="quote-totals"><span>Subtotal</span><strong>${money(invoice.subtotal)}</strong><span>GST</span><strong>${money(invoice.gst)}</strong><span class="grand-total">Amount due</span><strong class="grand-total">${money(invoice.total)}</strong></div>

    </div>
  `;
}

function printInvoice(){

  const preview=document.querySelector('.invoice-preview');

  if(!preview)return;

  const win=window.open('','_blank','width=900,height=700');

  if(!win)return;

  win.document.write(`<!doctype html><html><head><title>Tradie Business Hub Invoice</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#18231f}h2{margin:4px 0 20px}.eyebrow{font-size:12px;letter-spacing:1.5px;font-weight:700}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:9px;border-bottom:1px solid #ddd;text-align:left}th:nth-child(n+2),td:nth-child(n+2){text-align:right}.quote-totals{display:grid;grid-template-columns:1fr auto;gap:8px;max-width:300px;margin-left:auto}.grand-total{font-size:18px;font-weight:800}button{display:none}hr{border:0;border-top:1px solid #ddd;margin:20px 0}</style></head><body>${preview.innerHTML}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(()=>win.print(),250);
}

/* =========================
   CALCULATORS
========================= */

function calcRate(){

  const income=
    Number(
      document.getElementById('income').value
    )||0;

  const h=
    Number(
      document.getElementById('hours').value
    )||1;

  const w=
    Number(
      document.getElementById('weeks').value
    )||1;

  document.getElementById(
    'rate-result'
  ).textContent=

    `Minimum income-only rate: ${
      money(income/(h*w))
    } per billable hour. Add overheads, tax and profit before setting your final charge-out rate.`;
}

function calcGST(){

  const n=
    Number(
      document.getElementById('gst').value
    )||0;

  document.getElementById(
    'gst-result'
  ).textContent=

    `Ex GST: ${money(n)} · GST: ${money(n*.1)} · Inc GST: ${money(n*1.1)}`;
}

/* =========================
   REVIEW RESPONSES
========================= */

function makeReview(){

  const r=
    document.getElementById(
      'review'
    ).value.trim();

  const tone=
    document.getElementById(
      'tone'
    ).value;

  if(!r){

    document.getElementById(
      'review-result'
    ).textContent=
      'Paste a customer review first.';

    return;
  }

  let opener=

    tone.includes('Short')

      ? 'Thanks for the great feedback!'

      : tone.includes('Warm')

      ? 'Thanks so much for taking the time to share your experience — we really appreciate it!'

      : 'Thanks for your kind review and for choosing our business!';

  document.getElementById(
    'review-result'
  ).textContent=

    opener+
    ' We’re glad you were happy with the work and service. We appreciate your support and look forward to helping you again.';
}

/* =========================
   START APP
========================= */

document.addEventListener(
  'DOMContentLoaded',
  ()=>{
    setupQuoteBuilder();
    setupInvoiceBuilder();
  }
);
