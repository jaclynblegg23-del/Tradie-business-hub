function showPanel(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
  const el=document.getElementById('panel-'+name);
  if(el)el.classList.remove('hidden');

  document.querySelectorAll('.side').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.side').forEach(s=>{
    if(s.textContent.toLowerCase().includes(name==='dashboard'?'dashboard':name))
      s.classList.add('active');
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
  }).format(n);
}

/* NEW QUOTE BUILDER */
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
        <label>Quote number
          <input id="qnumber" value="QT-1001">
        </label>

        <label>Quote date
          <input id="qdate" type="date">
        </label>

        <label>Valid until
          <input id="qvalid" type="date">
        </label>

        <label>Customer name
          <input id="qcustomer" placeholder="Customer name">
        </label>

        <label>Customer email
          <input id="qemail" type="email" placeholder="customer@email.com">
        </label>

        <label>Job address
          <input id="qaddress" placeholder="Job address">
        </label>
      </div>

      <label>Job description
        <textarea id="qdesc" rows="3" placeholder="Describe the work to be completed"></textarea>
      </label>

      <h3>Quote items</h3>

      <div id="quote-items">
        <div class="quote-item">
          <input class="item-desc" placeholder="Item or service">
          <input class="item-qty" type="number" value="1" min="0" placeholder="Qty">
          <input class="item-rate" type="number" min="0" step="0.01" placeholder="Rate ex GST">
        </div>
      </div>

      <button type="button" onclick="addQuoteItem()">+ Add line item</button>

      <label class="checkbox-row">
        <input id="qgst" type="checkbox" checked>
        Include 10% GST
      </label>

      <label>Notes to customer
        <textarea id="qnotes" rows="3" placeholder="Additional information"></textarea>
      </label>

      <label>Payment / quote terms
        <textarea id="qterms" rows="3" placeholder="Example: 50% deposit required before work commences."></textarea>
      </label>

      <br>

      <button class="btn btn-primary" onclick="previewQuote()">
        Preview Quote
      </button>

      <button type="button" onclick="resetQuote()">
        Clear
      </button>

      <div id="quote-result"></div>

    </div>
  `;

  const today=new Date();
  document.getElementById('qdate').value=today.toISOString().slice(0,10);

  const valid=new Date();
  valid.setDate(valid.getDate()+14);
  document.getElementById('qvalid').value=valid.toISOString().slice(0,10);
}

function addQuoteItem(){
  const box=document.getElementById('quote-items');

  const row=document.createElement('div');
  row.className='quote-item';

  row.innerHTML=`
    <input class="item-desc" placeholder="Item or service">
    <input class="item-qty" type="number" value="1" min="0" placeholder="Qty">
    <input class="item-rate" type="number" min="0" step="0.01" placeholder="Rate ex GST">
  `;

  box.appendChild(row);
}

function previewQuote(){
  const customer=document.getElementById('qcustomer').value||'Customer';
  const email=document.getElementById('qemail').value||'';
  const address=document.getElementById('qaddress').value||'Job address';
  const number=document.getElementById('qnumber').value||'QT-1001';
  const date=document.getElementById('qdate').value||'';
  const valid=document.getElementById('qvalid').value||'';
  const desc=document.getElementById('qdesc').value||'Work';

  let subtotal=0;
  let items='';

  document.querySelectorAll('#quote-items .quote-item').forEach(row=>{
    const d=row.querySelector('.item-desc').value||'Work';
    const q=Number(row.querySelector('.item-qty').value)||0;
    const r=Number(row.querySelector('.item-rate').value)||0;
    const total=q*r;

    if(d||total){
      subtotal+=total;
      items+=`<tr>
        <td>${d}</td>
        <td>${q}</td>
        <td>${money(r)}</td>
        <td>${money(total)}</td>
      </tr>`;
    }
  });

  const gst=document.getElementById('qgst').checked ? subtotal*0.10 : 0;
  const total=subtotal+gst;
  const notes=document.getElementById('qnotes').value;
  const terms=document.getElementById('qterms').value;

  document.getElementById('quote-result').innerHTML=`
    <div class="result">
      <h2>QUOTE ${number}</h2>

      <strong>${customer}</strong><br>
      ${email}<br>
      ${address}

      <hr>

      <strong>Quote date:</strong> ${date}<br>
      <strong>Valid until:</strong> ${valid}<br><br>

      <strong>Job description</strong><br>
      ${desc}

      <br><br>

      <table style="width:100%">
        <thead>
          <tr>
            <th align="left">Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>

      <hr>

      <div style="text-align:right">
        Subtotal: ${money(subtotal)}<br>
        GST: ${money(gst)}<br>
        <strong>Total: ${money(total)}</strong>
      </div>

      ${notes ? `<hr><strong>Notes</strong><br>${notes}` : ''}

      ${terms ? `<hr><strong>Payment / Terms</strong><br>${terms}` : ''}
    </div>
  `;
}

function resetQuote(){
  setupQuoteBuilder();
}

function makeInvoice(){
  const c=document.getElementById('icustomer').value||'Customer';
  const n=document.getElementById('inum').value||'INV-1001';
  const d=document.getElementById('idesc').value||'Work';
  const p=Number(document.getElementById('iprice').value)||0;

  document.getElementById('invoice-result').innerHTML=
  `<div class="result">
    <strong>INVOICE ${n}</strong><br>
    ${c}<br>
    ${d}<br><br>
    Subtotal: ${money(p)}<br>
    GST: ${money(p*.1)}<br>
    <strong>Amount due: ${money(p*1.1)}</strong>
  </div>`;
}

function calcRate(){
  const income=Number(document.getElementById('income').value)||0;
  const h=Number(document.getElementById('hours').value)||1;
  const w=Number(document.getElementById('weeks').value)||1;

  document.getElementById('rate-result').textContent=
  `Minimum income-only rate: ${money(income/(h*w))} per billable hour. Add overheads, tax and profit before setting your final charge-out rate.`;
}

function calcGST(){
  const n=Number(document.getElementById('gst').value)||0;

  document.getElementById('gst-result').textContent=
  `Ex GST: ${money(n)} · GST: ${money(n*.1)} · Inc GST: ${money(n*1.1)}`;
}

function makeReview(){
  const r=document.getElementById('review').value.trim();
  const tone=document.getElementById('tone').value;

  if(!r){
    document.getElementById('review-result').textContent=
    'Paste a customer review first.';
    return;
  }

  let opener=tone.includes('Short')
    ?'Thanks for the great feedback!'
    :tone.includes('Warm')
    ?'Thanks so much for taking the time to share your experience — we really appreciate it!'
    :'Thanks for your kind review and for choosing our business!';

  document.getElementById('review-result').textContent=
    opener+' We’re glad you were happy with the work and service. We appreciate your support and look forward to helping you again.';
}

document.addEventListener('DOMContentLoaded',setupQuoteBuilder);
