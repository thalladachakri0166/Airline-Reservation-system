// State Management
const state = {
    flights: [],
    passengers: [],
    reservations: []
};

// API Base Paths
const API = {
    flights: '/flights',
    flightSingle: (num) => `/flight/${num}`,
    flightDelete: (num) => `/airline/${num}`,
    
    passengers: '/passengers',
    passengerSingle: (id) => `/passenger/${id}`,
    passengerCreate: '/passenger',
    
    reservations: '/reservations',
    reservationSingle: (num) => `/reservation/${num}`,
    reservationCreate: '/reservation'
};

// Document Elements
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadAllData();
});

// Navigation & Routing
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-menu .nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Toggle active classes on buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Toggle active classes on tab content
            tabContents.forEach(tab => {
                if (tab.id === targetTab) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });

            // Update page titles
            updateTitles(targetTab);

            // Fetch latest data for that tab
            loadAllData();
        });
    });
}

function updateTitles(tabId) {
    const title = document.getElementById('current-tab-title');
    const subtitle = document.getElementById('current-tab-subtitle');

    switch (tabId) {
        case 'dashboard-tab':
            title.textContent = 'Dashboard Overview';
            subtitle.textContent = 'Real-time status of flights, passengers, and reservations.';
            break;
        case 'flights-tab':
            title.textContent = 'Flights Management';
            subtitle.textContent = 'Create, update, view, and delete flights.';
            break;
        case 'passengers-tab':
            title.textContent = 'Passengers Directory';
            subtitle.textContent = 'Manage passenger details, contact info, and booking profiles.';
            break;
        case 'reservations-tab':
            title.textContent = 'Reservations & Bookings';
            subtitle.textContent = 'Issue, update, look up, and cancel passenger flight reservations.';
            break;
    }
}

// Data Fetching
async function loadAllData() {
    try {
        const [flightsRes, passengersRes, reservationsRes] = await Promise.all([
            fetch(API.flights),
            fetch(API.passengers),
            fetch(API.reservations)
        ]);

        if (flightsRes.ok) state.flights = await flightsRes.json();
        if (passengersRes.ok) state.passengers = await passengersRes.json();
        if (reservationsRes.ok) state.reservations = await reservationsRes.json();

        updateDashboardStats();
        renderFlightsTable();
        renderPassengersTable();
        renderReservationsTable();
    } catch (err) {
        console.error('Error loading directory data:', err);
        showToast('Failed to sync data from server', 'error');
    }
}

// UI Rendering
function updateDashboardStats() {
    document.getElementById('stat-flights-count').textContent = state.flights.length;
    document.getElementById('stat-passengers-count').textContent = state.passengers.length;
    document.getElementById('stat-reservations-count').textContent = state.reservations.length;
}

function renderFlightsTable() {
    const tbody = document.getElementById('flights-table-body');
    tbody.innerHTML = '';

    if (state.flights.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No flights found.</td></tr>`;
        return;
    }

    state.flights.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHtml(f.flightNumber)}</strong></td>
            <td>${escapeHtml(f.origin)}</td>
            <td>${escapeHtml(f.destination)}</td>
            <td>${formatDate(f.departureTime)}</td>
            <td>${formatDate(f.arrivalTime)}</td>
            <td><span class="badge">${f.seatsLeft} / ${f.plane ? f.plane.capacity : 'N/A'}</span></td>
            <td><strong>$${f.price}</strong></td>
            <td>
                <button class="btn btn-secondary btn-action-small" onclick="viewFlightDetails('${f.flightNumber}')">Info</button>
                <button class="btn btn-danger btn-action-small" onclick="deleteFlight('${f.flightNumber}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPassengersTable() {
    const tbody = document.getElementById('passengers-table-body');
    tbody.innerHTML = '';

    if (state.passengers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No passengers registered.</td></tr>`;
        return;
    }

    state.passengers.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${escapeHtml(p.id)}</code></td>
            <td>${escapeHtml(p.firstname)}</td>
            <td>${escapeHtml(p.lastname)}</td>
            <td>${p.age}</td>
            <td>${escapeHtml(p.gender)}</td>
            <td>${escapeHtml(p.phone)}</td>
            <td>
                <button class="btn btn-secondary btn-action-small" onclick="editPassenger('${p.id}')">Edit</button>
                <button class="btn btn-danger btn-action-small" onclick="deletePassenger('${p.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderReservationsTable() {
    const tbody = document.getElementById('reservations-table-body');
    tbody.innerHTML = '';

    if (state.reservations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No reservations registered.</td></tr>`;
        return;
    }

    state.reservations.forEach(r => {
        const flightNumbers = r.flights ? r.flights.map(f => f.flightNumber).join(', ') : 'None';
        const totalPrice = r.flights ? r.flights.reduce((sum, f) => sum + f.price, 0) : 0;
        const passengerName = r.passenger ? `${r.passenger.firstname} ${r.passenger.lastname}` : 'Unknown';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${escapeHtml(r.orderNumber)}</code></td>
            <td><code>${r.passenger ? escapeHtml(r.passenger.id) : 'N/A'}</code></td>
            <td>${escapeHtml(passengerName)}</td>
            <td>${escapeHtml(flightNumbers)}</td>
            <td><strong>$${totalPrice}</strong></td>
            <td>
                <button class="btn btn-secondary btn-action-small" onclick="editReservation('${r.orderNumber}')">Update Flights</button>
                <button class="btn btn-danger btn-action-small" onclick="cancelReservation('${r.orderNumber}')">Cancel</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal Helpers
window.openModal = function(modalId) {
    document.getElementById(modalId).style.display = 'flex';
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Clear forms when modal closes
    if (modalId === 'flight-modal') {
        document.getElementById('flight-form').reset();
        document.getElementById('f-number').disabled = false;
        document.getElementById('flight-modal-title').textContent = 'Create New Flight';
    } else if (modalId === 'passenger-modal') {
        document.getElementById('passenger-form').reset();
        document.getElementById('p-id').value = '';
        document.getElementById('passenger-modal-title').textContent = 'Create Passenger';
    } else if (modalId === 'reservation-modal') {
        document.getElementById('reservation-form').reset();
        document.getElementById('passenger-select-group').style.display = 'block';
        document.getElementById('flights-select-group').style.display = 'block';
        document.getElementById('edit-reservation-fields').style.display = 'none';
        document.getElementById('reservation-modal-title').textContent = 'Create New Reservation';
    }
};

// Flight Operations
async function handleFlightSubmit(event) {
    event.preventDefault();
    const flightNumber = document.getElementById('f-number').value.trim();
    
    const params = new URLSearchParams();
    params.append('price', document.getElementById('f-price').value);
    params.append('origin', document.getElementById('f-origin').value.trim());
    params.append('destination', document.getElementById('f-destination').value.trim());
    params.append('departureTime', document.getElementById('f-dep').value.trim());
    params.append('arrivalTime', document.getElementById('f-arr').value.trim());
    params.append('description', document.getElementById('f-desc').value.trim());
    params.append('capacity', document.getElementById('f-cap').value);
    params.append('model', document.getElementById('f-model').value.trim());
    params.append('manufacturer', document.getElementById('f-mfr').value.trim());
    params.append('yearOfManufacture', document.getElementById('f-year').value);

    try {
        const response = await fetch(API.flightSingle(flightNumber), {
            method: 'POST',
            body: params
        });

        const data = await response.json();
        if (response.ok) {
            showToast('Flight saved successfully!', 'success');
            closeModal('flight-modal');
            loadAllData();
        } else {
            showToast(data.msg || data.message || 'Error saving flight', 'error');
        }
    } catch (err) {
        showToast('Network error saving flight', 'error');
    }
}

window.deleteFlight = async function(flightNumber) {
    if (!confirm(`Are you sure you want to delete flight ${flightNumber}?`)) return;

    try {
        const response = await fetch(API.flightDelete(flightNumber), {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Flight deleted successfully!', 'success');
            loadAllData();
        } else {
            const data = await response.json();
            showToast(data.msg || data.message || 'Failed to delete flight (check for active reservations)', 'error');
        }
    } catch (err) {
        showToast('Network error deleting flight', 'error');
    }
};

window.viewFlightDetails = function(flightNumber) {
    const flight = state.flights.find(f => f.flightNumber === flightNumber);
    if (!flight) return;

    const body = document.getElementById('details-modal-body');
    let passengersList = '<p style="color: var(--text-muted)">No passengers booked on this flight.</p>';
    if (flight.passengers && flight.passengers.length > 0) {
        passengersList = `<ul class="details-list">` + 
            flight.passengers.map(p => `<li>👤 <strong>${escapeHtml(p.firstname)} ${escapeHtml(p.lastname)}</strong> (ID: <code>${p.id}</code>)</li>`).join('') + 
            `</ul>`;
    }

    body.innerHTML = `
        <div class="details-section">
            <h5>Route Details</h5>
            <p><strong>Route:</strong> ${escapeHtml(flight.origin)} ➔ ${escapeHtml(flight.destination)}</p>
            <p><strong>Departs:</strong> ${formatDate(flight.departureTime)}</p>
            <p><strong>Arrives:</strong> ${formatDate(flight.arrivalTime)}</p>
            <p><strong>Price:</strong> $${flight.price}</p>
            <p><strong>Description:</strong> ${escapeHtml(flight.description || 'No description')}</p>
        </div>
        <div class="details-section">
            <h5>Aircraft Details</h5>
            <p><strong>Model:</strong> ${escapeHtml(flight.plane ? flight.plane.model : 'N/A')}</p>
            <p><strong>Manufacturer:</strong> ${escapeHtml(flight.plane ? flight.plane.manufacturer : 'N/A')}</p>
            <p><strong>Manufacture Year:</strong> ${flight.plane ? flight.plane.yearOfManufacture : 'N/A'}</p>
            <p><strong>Total Capacity:</strong> ${flight.plane ? flight.plane.capacity : 'N/A'}</p>
            <p><strong>Seats Left:</strong> ${flight.seatsLeft}</p>
        </div>
        <div class="details-section">
            <h5>Passengers On Board</h5>
            ${passengersList}
        </div>
    `;

    document.getElementById('details-modal-title').textContent = `Flight ${flightNumber} Details`;
    openModal('details-modal');
};

// Passenger Operations
async function handlePassengerSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('p-id').value;
    const isEdit = !!id;

    const params = new URLSearchParams();
    params.append('firstname', document.getElementById('p-first').value.trim());
    params.append('lastname', document.getElementById('p-last').value.trim());
    params.append('age', document.getElementById('p-age').value);
    params.append('gender', document.getElementById('p-gender').value);
    params.append('phone', document.getElementById('p-phone').value.trim());

    const url = isEdit ? API.passengerSingle(id) : API.passengerCreate;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            body: params
        });

        const data = await response.json();
        if (response.ok) {
            showToast(`Passenger ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
            closeModal('passenger-modal');
            loadAllData();
        } else {
            showToast(data.msg || data.message || 'Error saving passenger', 'error');
        }
    } catch (err) {
        showToast('Network error saving passenger', 'error');
    }
}

window.editPassenger = function(id) {
    const p = state.passengers.find(item => item.id === id);
    if (!p) return;

    document.getElementById('p-id').value = p.id;
    document.getElementById('p-first').value = p.firstname;
    document.getElementById('p-last').value = p.lastname;
    document.getElementById('p-age').value = p.age;
    document.getElementById('p-gender').value = p.gender;
    document.getElementById('p-phone').value = p.phone;

    document.getElementById('passenger-modal-title').textContent = 'Update Passenger';
    openModal('passenger-modal');
};

window.deletePassenger = async function(id) {
    if (!confirm('Are you sure you want to delete this passenger?')) return;

    try {
        const response = await fetch(API.passengerSingle(id), {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Passenger deleted successfully!', 'success');
            loadAllData();
        } else {
            const data = await response.json();
            showToast(data.msg || data.message || 'Failed to delete passenger (verify they have no active reservations)', 'error');
        }
    } catch (err) {
        showToast('Network error deleting passenger', 'error');
    }
};

// Reservation Operations
async function handleReservationSubmit(event) {
    event.preventDefault();
    const orderNumber = document.getElementById('r-number').value;
    const isEdit = !!orderNumber;

    const params = new URLSearchParams();

    if (!isEdit) {
        params.append('passengerId', document.getElementById('r-passenger-id').value.trim());
        const flightsStr = document.getElementById('r-flight-numbers').value.trim();
        flightsStr.split(',').forEach(num => params.append('flightNumbers', num.trim()));
    } else {
        const addedStr = document.getElementById('r-flights-add').value.trim();
        const removedStr = document.getElementById('r-flights-remove').value.trim();
        
        if (addedStr) {
            addedStr.split(',').forEach(num => params.append('flightsAdded', num.trim()));
        }
        if (removedStr) {
            removedStr.split(',').forEach(num => params.append('flightsRemoved', num.trim()));
        }
    }

    const url = isEdit ? API.reservationSingle(orderNumber) : API.reservationCreate;
    
    try {
        const response = await fetch(url, {
            method: 'POST', // Both create and update use POST endpoints in ReservationController
            body: params
        });

        const data = await response.json();
        if (response.ok) {
            showToast(`Reservation ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
            closeModal('reservation-modal');
            loadAllData();
        } else {
            showToast(data.msg || data.message || 'Error processing reservation request', 'error');
        }
    } catch (err) {
        showToast('Network error processing reservation', 'error');
    }
}

window.editReservation = function(orderNumber) {
    const res = state.reservations.find(r => r.orderNumber === orderNumber);
    if (!res) return;

    document.getElementById('r-number').value = orderNumber;
    document.getElementById('passenger-select-group').style.display = 'none';
    document.getElementById('flights-select-group').style.display = 'none';
    document.getElementById('edit-reservation-fields').style.display = 'block';

    document.getElementById('reservation-modal-title').textContent = `Update Reservation #${orderNumber}`;
    openModal('reservation-modal');
};

window.cancelReservation = async function(orderNumber) {
    if (!confirm(`Are you sure you want to cancel reservation #${orderNumber}?`)) return;

    try {
        const response = await fetch(API.reservationSingle(orderNumber), {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Reservation cancelled successfully!', 'success');
            loadAllData();
        } else {
            const data = await response.json();
            showToast(data.msg || data.message || 'Failed to cancel reservation', 'error');
        }
    } catch (err) {
        showToast('Network error cancelling reservation', 'error');
    }
};

// Utility Helpers
function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString([], { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return dateStr;
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : '⚠'}</span>
        <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}
