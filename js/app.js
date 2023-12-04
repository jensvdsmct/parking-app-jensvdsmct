const $loader = document.querySelector(`.js-loader`);
const $app = document.querySelector(`.js-app`);

const $list = document.querySelector(`.js-list`);
const $listWrapper = document.querySelector(`.js-list-wrapper`);

const $parkingPlaceholder = document.querySelector(`.js-parking-placeholder`);
const $parkingPlaceholderTitle = document.querySelector(`.js-parking-placeholder__title`);

const $parkingInfo = document.querySelector(`.js-parking-info`);
const $parkingLoader = document.querySelector(`.js-parking-loader`);
const $parkingTitle = document.querySelector(`.js-parking-title`);
const $parkingFavorite = document.querySelector(`.js-parking-favorite`);
const $parkingStatus = document.querySelector(`.js-parking-status`);
const $parkingCurrOccupation = document.querySelector(`.js-parking-curr-occupation`);
const $parkingMaxOccupation = document.querySelector(`.js-parking-max-occupation`);
const $parkingOccupation = document.querySelector(`.js-parking-occup`);
const $gauge = document.querySelector(`.gauge--3 .semi-circle--mask`);
const $parkingDetails = document.querySelector(`.js-parking-details`);
const $parkingCattegory = document.querySelector(`.js-parking-category`);
const $parkingCategoryIcon = document.querySelector(`.js-parking-category-icon`);
const $parkingCategoryBtn = document.querySelector(`.js-parking-category-btn`);
const $parkingDescription = document.querySelector(`.js-parking-description`);
const $parkingUrl = document.querySelector(`.js-parking-url`);
const $parkingLocation = document.querySelector(`.js-parking-location`);
const $parkingLocationBtn = document.querySelector(`.js-parking-location-btn`);


const getNames = async () => {
    const apiUrl = `https://data.stad.gent/api/explore/v2.1/catalog/datasets/bezetting-parkeergarages-real-time/records?select=id%2C%20name&limit=100`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const parkings = data.results;
        if (parkings.length === 0) {
            document.body.innerHTML = `<h1 class="c-loader__error">Er is iets misgelopen bij het ophalen van de parkinggegevens. Probeer het later opnieuw.</h1>`;
            return;
        }
        parkings.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
            else if (a.name > b.name) {
                return 1;
            }
            else {
                return 0;
            }
        })
        renderList(parkings);

        const favoriteParking = localStorage.getItem(`FavoriteParking`);
        console.log("Favorite parking: " + favoriteParking);
        if (favoriteParking) {
            const favoriteParkingRadio = document.querySelector(`input[parking-number="${favoriteParking}"]`);
            if (favoriteParkingRadio) {
                favoriteParkingRadio.checked = true;
                favoriteParkingRadio.onchange();
            }
        }

        $loader.classList.add(`u-hidden`);
        $app.classList.remove(`u-hidden`);
    } catch (error) {
        console.error('Error fetching parking names:', error);
    }
}

const renderList = (parkings) => {
    let i = 1;
    parkings.forEach(parking => {
        let $listitem = document.createElement(`li`);
        $listitem.classList.add(`c-list__item`);

        let $radio = document.createElement(`input`);
        $radio.classList.add(`c-input`, `o-hide-accessible`);
        $radio.setAttribute(`type`, `radio`);
        $radio.setAttribute(`name`, `parking`);
        $radio.setAttribute(`value`, `${parking.name}`);
        $radio.setAttribute(`id`, `${parking.name}`);
        $radio.setAttribute(`parking-number`, i);
        console.log("Parking number: " + i);
        $radio.onchange = function () {
            renderParking(parking.id, i);
            console.log("Rendering number: " + i + " - " + parking.name);
            //force remove the hover state from the list wrapper
            $listWrapper.classList.remove(`c-list__wrapper--hover`);
        }

        let $label = document.createElement(`label`);
        $label.classList.add(`c-list__item__label`);
        $label.setAttribute(`for`, `${parking.name}`);
        $label.textContent = `${parking.name}`;

        $label.appendChild($radio);
        $listitem.appendChild($label);
        $list.appendChild($listitem);

        i++;
    })
}

const renderParking = async (parkingId, parkingNumber) => {
    // Set a flag to track whether the request is taking longer than 0.5 seconds
    let isDelayed = false;

    // Show the loader after 0.5 seconds
    const delayTimeout = setTimeout(() => {
        if (!isDelayed) {
            $parkingLoader.classList.remove(`u-hidden`);
        }
    }, 250);

    $parkingPlaceholder.classList.add(`u-hidden`);
    $parkingInfo.classList.add(`u-hidden`);

    const parkingDetails = await getDetails(parkingId);

    // Clear the delay timeout if the request completes before 0.5 seconds
    clearTimeout(delayTimeout);
    isDelayed = true;

    $parkingFavorite.onclick = function () {
        $parkingFavorite.classList.toggle(`c-parking__favorite--active`);
        localStorage.setItem(`FavoriteParking`, parkingNumber);
        console.log("Favorite parking: " + parkingNumber);
    }

    if (parkingDetails) {
        $parkingTitle.textContent = parkingDetails[0].name;


        if (parkingDetails[0].isopennow = 0) {
            $parkingStatus.classList.add(`c-parking__status--closed`);
            $parkingStatus.textContent = "Gesloten";
        }
        else {
            const totalcapacity = parkingDetails[0].totalcapacity;
            const currentOccupation = totalcapacity - parkingDetails[0].availablecapacity;
            const occupationPercentage = parkingDetails[0].occupation;
            $parkingCurrOccupation.textContent = currentOccupation;
            $parkingMaxOccupation.textContent = totalcapacity;
            $parkingOccupation.textContent = occupationPercentage + "%";

            rendergauge(occupationPercentage);

            let categorie = parkingDetails[0].categorie;
            categorie = categorie.charAt(0).toUpperCase() + categorie.slice(1);
            if (categorie.toUpperCase() == "PARKING IN LEZ")
                $parkingCategoryIcon.classList.add(`c-parking__details__icon--category--LEZ`);
            else
                $parkingCategoryIcon.classList.remove(`c-parking__details__icon--category--LEZ`);
            $parkingCattegory.textContent = categorie;

            let lat = parkingDetails[0].location.lat;
            let lon = parkingDetails[0].location.lon;

            // Round the coordinates to 4 decimals
            lat = lat.toFixed(4);
            lon = lon.toFixed(4);

            let coordinates = lat + "°N, " + lon + "°E";
            console.log(coordinates);
            $parkingLocation.textContent = coordinates;

            // Add an event listener to the location button
            $parkingLocationBtn.addEventListener('click', () => {
                // Open the default navigation app with the not rounded up coordinates
                const navigationUrl = `https://maps.google.com/?q=${lat},${lon}`;
                window.open(navigationUrl, '_blank');
            });
            

            // let description = parkingDetails[0].description;
            // description = description.charAt(0).toUpperCase() + description.slice(1);
            // $parkingDescription.textContent = description;

            // $parkingUrl.innerHTML = ``;
            // let url = parkingDetails[0].urllinkaddress;
            // const urlLink = document.createElement(`a`);
            // urlLink.setAttribute(`href`, url);
            // urlLink.setAttribute(`target`, `_blank`);
            // urlLink.textContent = "Meer info";
            // $parkingUrl.appendChild(urlLink);
        }
    } else {
        $parkingPlaceholder.classList.remove(`u-hidden`);
        $parkingPlaceholderTitle.innerHTML = `Er is iets misgelopen bij het ophalen van de parkeergegevens. Probeer het later opnieuw.`;
        return;
    }

    $parkingLoader.classList.add(`u-hidden`);
    $parkingInfo.classList.remove(`u-hidden`);
};

const rendergauge = (percentage) => {
    let deg = percentage * 1.8;
    $gauge.setAttribute(`style`, `-webkit-transform: rotate(${deg}deg); -moz-transform: rotate(${deg}deg); transform: rotate(${deg}deg);`);
}

const getDetails = async (id) => {
    const parkingId = encodeURIComponent(id);
    const apiUrl = `https://data.stad.gent/api/explore/v2.1/catalog/datasets/bezetting-parkeergarages-real-time/records?where=id%20%3D%20%22${parkingId}%22&limit=100`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const parking = data.results;
        console.log(parking);
        return parking;
    } catch (error) {
        $parkingInfo.classList.add(`u-hidden`);
        $parkingLoader.classList.add(`u-hidden`);
        $parkingPlaceholder.classList.remove(`u-hidden`);
        $parkingPlaceholderTitle.innerHTML = `Er is iets misgelopen bij het ophalen van de parkeergegevens. Probeer het later opnieuw.`;
    }
};

const init = () => {
    getNames();

    // Add event listener to the list wrapper to toggle the hover state
    $listWrapper.addEventListener(`mouseenter`, () => {
        $listWrapper.classList.add(`c-list__wrapper--hover`);
    });

    $listWrapper.addEventListener(`click`, () => {
        $listWrapper.classList.add(`c-list__wrapper--hover`);
    });

    $listWrapper.addEventListener(`mouseleave`, () => {
        $listWrapper.classList.remove(`c-list__wrapper--hover`);
    });

    // Add event listener to the category button to open the website
    $parkingCategoryBtn.addEventListener(`click`, () => {
        let url = "https://lez.stad.gent/";
        window.open(url, `_blank`);
    });
};

init();