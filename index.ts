import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
//import { getFirestore, collection, getDocs } from "firebase/firestore/lite";

// Import the functions you need from the SDKs you need

let map: google.maps.Map;
let service: google.maps.places.PlacesService;
let infoWindow;
let currentInfoWindow;

let bounds: google.maps.LatLngBounds;
let infoPane;

function showPanel(placeResult) {
  // If infoPane is already open, close it
  if (infoPane.classList.contains("open")) {
    infoPane.classList.remove("open");
  }

  // Clear the previous details
  while (infoPane.lastChild) {
    infoPane.removeChild(infoPane.lastChild);
  }

  /* TODO: Step 4E: Display a Place Photo with the Place Details */
  if (placeResult.photos != null) {
    let firstPhoto = placeResult.photos[0];
    let photo = document.createElement("img");
    photo.classList.add("hero");
    photo.src = firstPhoto.getUrl();
    infoPane.appendChild(photo);
  } else console.log("No photo for " + placeResult.name);

  // Add place details with text formatting
  let name = document.createElement("h1");
  name.classList.add("place");
  name.textContent = placeResult.name;
  infoPane.appendChild(name);
  if (placeResult.rating != null) {
    let rating = document.createElement("p");
    rating.classList.add("details");
    rating.textContent = `Rating: ${placeResult.rating} \u272e`;
    infoPane.appendChild(rating);
  }
  let address = document.createElement("p");
  address.classList.add("details");
  address.textContent = placeResult.formatted_address;
  infoPane.appendChild(address);
  let bstat = document.createElement("p");
  bstat.classList.add("details");
  bstat.textContent = placeResult.business_status;
  infoPane.appendChild(bstat);
  let ptyp = document.createElement("p");
  ptyp.classList.add("details");
  ptyp.textContent = placeResult.types;
  infoPane.appendChild(ptyp);
  if (placeResult.website) {
    let websitePara = document.createElement("p");
    let websiteLink = document.createElement("a");
    let websiteUrl = document.createTextNode(placeResult.website);
    websiteLink.appendChild(websiteUrl);
    websiteLink.title = placeResult.website;
    websiteLink.href = placeResult.website;
    websitePara.appendChild(websiteLink);
    infoPane.appendChild(websitePara);
  }

  // Open the infoPane
  infoPane.classList.add("open");
}

function showDetails(placeResult, marker, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    let placeInfowindow = new google.maps.InfoWindow();
    placeInfowindow.setContent(
      "<div><strong>" +
        placeResult.name +
        "</strong><br>" +
        "Rating: " +
        placeResult.rating +
        "</div>"
    );
    placeInfowindow.open(marker.map, marker);
    currentInfoWindow.close();
    currentInfoWindow = placeInfowindow;
    showPanel(placeResult);
    saveM(
      placeResult.placeId,
      placeResult.name,
      placeResult.phone,
      placeResult.address,
      placeResult.website
    );
  } else {
    console.log("showDetails failed: " + status);
  }
}

function createMarker(place: google.maps.places.PlaceResult) {
  console.log("Marker: " + place.name + ", Icon: " + place.icon);

  if (!place.geometry || !place.geometry.location || !place.place_id) return;

  let icSz = new google.maps.Size(30, 30);
  let icUrl =
    place.icon ||
    "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/worship_islam-71.png";
  const marker = new google.maps.Marker({
    map,
    icon: { url: icUrl, scaledSize: icSz },
    position: place.geometry.location,
    title: place.name,
    label: place.name
  });
  bounds.extend(place.geometry.location);
  map.fitBounds(bounds);

  google.maps.event.addListener(marker, "click", () => {
    var pid = place.place_id;
    if (pid === undefined) pid = "1";

    let mReq = {
      placeId: pid,
      fields: [
        "name",
        "formatted_address",
        "geometry",
        "rating",
        "website",
        "photos"
      ]
    };
    //showDetails(place, marker, google.maps.places.PlacesServiceStatus.OK);

    /* Only fetch the details of a place when the user clicks on a marker.
     * If we fetch the details for all place results as soon as we get
     * the search response, we will hit API rate limits. */
    if (mReq.placeId !== undefined) {
      service.getDetails(mReq, (placeResult, status) => {
        showDetails(placeResult, marker, status);
      });
    }
  });
}

function initMap(): void {
  map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
    zoom: 14,
    center: { lat: 30.1806684, lng: -95.773379 },
    mapTypeId: "terrain"
  });
  infoWindow = new google.maps.InfoWindow();
  currentInfoWindow = infoWindow;

  infoPane = document.getElementById("panel");

  var whereami = new google.maps.LatLng(30.1806684, -95.773379);
  //infowindow = new google.maps.InfoWindow();
  bounds = new google.maps.LatLngBounds();

  var request = {
    location: whereami,
    radius: 40000,
    query: "mosque"
  };
  service = new google.maps.places.PlacesService(map);

  service.textSearch(
    request,
    (
      results: google.maps.places.PlaceResult[] | null,
      status: google.maps.places.PlacesServiceStatus
    ) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        for (let i = 0; i < results.length; i++) {
          createMarker(results[i]);
        }

        map.setCenter(results[0].geometry!.location!);
      }
    }
  );
}

window.initMap = initMap;

//const firebase = require("firebase");
// Required for side-effects
//require("firebase/firestore");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCenBu6Cev-bVH9qYHRkew2y7nXEfOK6i4",
  authDomain: "iqaamah.firebaseapp.com",
  projectId: "iqaamah",
  storageBucket: "iqaamah.appspot.com",
  messagingSenderId: "359683300609",
  appId: "1:359683300609:web:a22c4c23bc67584a648f00"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getMs(db) {
  console.log("Getting Ms");
  const mCl = collection(db, "M");
  const mSnapshot = await getDocs(mCl);
  const mList = mSnapshot.docs.map((doc) => doc.data());
  console.log("M List length = " + mList.length);
  return mList;
}

async function saveM(pid, name, address, phone, website) {
  console.log("Adding masjid: " + name + " to DB");
  //console.log("FB Key: " + process.env.FirebaseKey);
  //console.log("DB Ref " + db.toJSON);
  console.log("Got db " + db.toJSON);
  const mCol = collection(db, "M");
  console.log("mCol path " + mCol.path);
  console.log("address " + address + ", website: " + website);

  await setDoc(doc(mCol, name), {
    name: name,
    //phone: phone,
    //address: address,
    website: website
  });
  const ml = getMs(db);
  console.log("M list 2 " + (await ml).length);
}
