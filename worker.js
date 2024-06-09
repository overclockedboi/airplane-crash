// owned by https://github.com/overclockedboi
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('query') || 'boeing 777';
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchQuery)}+accidents&srwhat=text&prop=extracts&exintro&explaintext`;
  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();
  const url = `https://raw.githubusercontent.com/overclockedboi/airplane-crash/main/airplane-crash.dump.json`
  const data = await fetch(url);
  const resData = await data.json();
  
  // Fetch additional details for each search result
  const pages = searchData.query.search;
  const pageDetailsPromises = pages.map(async (page) => {
    const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages|info&pageids=${page.pageid}&exintro&explaintext&piprop=thumbnail&pithumbsize=300&inprop=url`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
     const accident= await getAccident(detailsData.query.pages[page.pageid].title,resData);
    return { ...detailsData.query.pages[page.pageid], accident };
  });

  const pageDetails = await Promise.all(pageDetailsPromises);

  // Count the number of incidents
  const incidentCount = pages.length;

  // Create HTML cards
  const cardsHtml = pageDetails.map(page => createCard(page)).join('');

  // Generate HTML response
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <title>Airplane Incidents Search</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #f5f5f7;
          color: #333;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .container {
          max-width: 800px;
          margin: 20px;
          padding: 20px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 2em;
          margin: 0;
        }
        .header p {
          font-size: 1.2em;
          color: #666;
        }
        .search-bar {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .search-bar input {
          width: 80%;
          padding: 10px;
          font-size: 1em;
          border: 1px solid #ccc;
          border-radius: 8px;
          margin-right: 10px;
        }
        .search-bar button {
          padding: 10px 20px;
          font-size: 1em;
          background-color: #007aff;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .card {
          position: relative;
          overflow: hidden;
          border-radius: 10px;
          margin:10px;
          background-color:black;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s; /* add a transition effect */

        }
        
.card:hover {
  cursor: pointer; 
 
}
 

.shine {
  width: 1000px;
  height: 100px;
  margin-left: -100px;
  transform: rotate(30deg);
  background: -webkit-linear-gradient(top, transparent, rgba(200,200,200,0.1),transparent);
  position: absolute;
  
}

.card:hover .shine{
  -webkit-animation: shine 6s ease-in-out infinite;
}

.shadow {
  width: 275px;
  height: 5px;
  background: rgba(50,50,50,0.1);
  margin: -15px auto 0 auto;
  box-shadow: 0px 0px 20px rgba(50,50,50,0.1);
 
}

.card:hover .shadow{
  -webkit-animation: angle 6s ease-in-out infinite;
}

@-webkit-keyframes shimmy {
  0%, 100% {
    transform: rotateY(0deg) skewX(0deg);
  }
  50% {
    transform: rotateY(30deg) skewX(3deg);
  }
}

@-webkit-keyframes shine {
  0%, 100% {
    margin-top: -100px;
  }
  50% {
    margin-top: 800px;
  }
}

@-webkit-keyframes angle {
  0%, 100% {
    height: 5px;
  }
  50% {
    height: 15px;
    width: 260px;
    border-radius: 30% 90% 90% 30%;
    transform: skew(50deg,-10deg) translateX(13px);
  }
}
     
        .card-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          filter: blur(5px);
          opacity: 0.5;
          transform: scale(1.1);
        }
        
        .card-content {
          position: relative;
          z-index: 1;
          padding: 20px;
          color: #fff;
        }

        .card-title{
          font-weight: bold;
          color: #FFFFFF;
          font-size:1.7rem;
        }
        
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Airplane Incidents Search</h1>
          <p>Total Incidents: ${incidentCount}</p>
        </div>
        <div class="search-bar">
          <input type="text" id="searchInput" placeholder="Search for an airplane model..." value="${searchQuery}">
          <button onclick="search()">Search</button>
        </div>
        ${cardsHtml}
      </div>
      <script>
        function search() {
          const query = document.getElementById('searchInput').value;
          window.location.href = \`?query=\${encodeURIComponent(query)}\`;
        }
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'content-type': 'text/html' },
  });
}

function createCard(page) {
  const imageUrl = page.thumbnail ? page.thumbnail.source : 'https://via.placeholder.com/300';
  const extract = page.extract ? truncateText(page.extract, 150) : 'No summary available.';
  const year = extract.match(/\b(19|20)\d{2}\b/g);

  const cardHtml = `
  <div class="card" onclick="window.open('${page.fullurl}', '_blank');">
  
  <div class="card-background" style="background-image: url(${imageUrl}); background-size: cover; filter: blur(5px);"></div>
  <div class="card-content">
    <div>
      <img src="${imageUrl}" alt="${page.title}" class="card-image" style="border-radius: 10px; width: 80px; height: 80px; object-fit: cover;">
    </div>
    <div>
      <div><span class="card-title" >${page.title}</span></div>

      ${
       year?` <p><strong>Year of Incident:</strong> ${ year[0]}</p>`:''
      }
      ${
        page.accident[0]? `<p><strong>Accident Count:</strong> ${page.accident[0]}</p>
          <ul><strong>Accidents:</strong> ${page.accident[1].map((n)=>{ return `<li>${n}</li>`}).join("")}</ul>`
        :""
      }
      <p>${extract}</p>
    </div>
  </div>
  <div class="shine"></div>
  <div class="shadow"></div>
</div>
  `;

  return cardHtml;
}
async function getAccident(text,resData) {
  
  let count = 0;
  let accidentDetail = []
  for (const flight of resData) {
    if (flight["Airplane Name"]?.toLocaleLowerCase().includes(text.toLocaleLowerCase())) {
      count++;
      accidentDetail.push(flight["Details"])
    }
  }
  return [count,accidentDetail];
}
function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}
 
