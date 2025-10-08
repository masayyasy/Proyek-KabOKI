// --- DOM Elements (shared & page-specific) ---
// Elemen untuk home.html
const propertiForm = document.getElementById("propertiForm");
const propertiTableBody = document.getElementById("propertiTableBody");
const propertiDataTable = document.getElementById('propertiDataTable');
const koordinatInput = document.getElementById("koordinat");
const mapElement = document.getElementById("map");
const gradeSelect = document.getElementById("grade");
const referenceTable = document.getElementById('dataReferensiTable');
const referenceInputs = referenceTable ? referenceTable.querySelectorAll('input') : [];
const exportHomeTableBtn = document.getElementById('exportHomeTableBtn');
const exportTable2Btn = document.getElementById('exportTable2Btn');
const exportTable3Btn = document.getElementById('exportTable3Btn');
const nilaiDBKBInput = document.getElementById("nilaiDBKB");
const noResultsText = document.getElementById('noResultsText');

// Elemen untuk formulir3.html
const gradeInputJudul = document.getElementById("gradeInputJudul");
const analisisTableBody3 = document.getElementById("analisisTableBody3");
const analisisTable3 = document.getElementById("analisisDataTable3");

// --- Data Storage (shared) ---
let propertis = JSON.parse(localStorage.getItem('propertiData')) || [];
let dataReferensi = JSON.parse(localStorage.getItem('dataReferensi')) || {};

// URL Web App Google Apps Script
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-9B6IgyHtjeiG_0VqoAeaCXkzVJeKP5ex05QgHpUhzMUEC8QZ4dWzi1DsoAyKuxbI/exec"; // ganti dengan URL Web App kamu

// Fungsi untuk kirim data ke Google Sheets (digunakan untuk TAMBAH data baru)
// Fungsi untuk kirim data ke Google Sheets (digunakan untuk TAMBAH data baru)
function syncToGoogleSheets(data) {
    // ✅ Tambahkan property 'action: "insert"'
    fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, action: "insert" }) // Data baru harus menyertakan action: "insert"
    })
    .then(res => res.text())
    .then(txt => {
        console.log("Respon server (Tambah):", txt);
        // ✅ KRUSIAL: Muat ulang data dari Sheets setelah operasi POST sukses
        loadFromGoogleSheets(); 
    })
    .catch(err => console.error("Gagal sync ke Google Sheets:", err));
}


// Fungsi untuk ambil data dari Google Sheets
// Fungsi untuk ambil data dari Google Sheets (DIREVISI)
function loadFromGoogleSheets() {
    fetch(GOOGLE_APPS_SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            // 1. Simpan data terbaru ke variabel global
            propertis = data;
            
            // 2. Simpan ke localStorage (untuk Form 2 & 3)
            localStorage.setItem('propertiData', JSON.stringify(data)); 

            // 3. ✅ KRUSIAL: Render ulang tabel dengan data baru
            renderPropertiTable(); 
        })
        .catch(err => console.error("Gagal ambil data dari Google Sheets:", err));
}

// Objek untuk mendefinisikan grade tetap berdasarkan alamat
const alamatGrades = {
    "JL. LINTAS TIMUR": 9,
    "JL. POROS DESA": 8,
    "JL. KAPTEN TENDEAN": 7,
    "JL. SP-1 KAV": 8,
};

// Penanda untuk mode edit
let editModeId = null;
let map;
let marker;

// --- Utility Functions ---
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// --- Map Functions (home.html specific) ---
function initializeMap() {
    if (mapElement && !map) {
        map = L.map('map').setView([-6.2088, 106.8456], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);
        map.on('click', onMapClick);
        map.invalidateSize();
    }
}

function onMapClick(e) {
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
    koordinatInput.value = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
}

// --- Reference Table Functions (home.html specific) ---
function saveReferenceData() {
    const newDataReferensi = {};
    referenceInputs.forEach(input => {
        const id = input.dataset.id;
        let value = input.value;
        if (!isNaN(value) && value.trim() !== '') value = parseFloat(value);
        newDataReferensi[id] = value;
    });
    localStorage.setItem('dataReferensi', JSON.stringify(newDataReferensi));
    dataReferensi = newDataReferensi;
}

function loadReferenceData() {
    const storedData = JSON.parse(localStorage.getItem('dataReferensi'));
    if (storedData) {
        dataReferensi = storedData;
        referenceInputs.forEach(input => {
            const id = input.dataset.id;
            if (dataReferensi[id] !== undefined) input.value = dataReferensi[id];
        });
    }
}

// --- Form Handling (FINAL DAN BENAR) ---
if (propertiForm) {
    propertiForm.addEventListener("submit", function(event) {
        event.preventDefault();

        let newProperti = null;

        if (editModeId) {
            // 🔹 EDIT DATA
            const propertiIndex = propertis.findIndex(p => p.id === editModeId);
            if (propertiIndex > -1) {
                // (Mengumpulkan data baru dari form)
                newProperti = {
                    id: propertis[propertiIndex].id,
                    alamatObjekPajak: document.getElementById("alamatObjekPajak").value,
                    blokNop: document.getElementById("blokNop").value,
                    kodeZNT: document.getElementById("kodeZNT").value,
                    sumber: document.getElementById("sumber").value,
                    jenis: document.getElementById("jenis").value,
                    tanggal: document.getElementById("tanggal").value,
                    hargaTransaksi: parseFloat(document.getElementById("hargaTransaksi").value),
                    jenisPenggunaan: document.getElementById("jenisPenggunaan").value,
                    luas: parseFloat(document.getElementById("luas").value),
                    lebarSisiDepan: parseFloat(document.getElementById("lebarSisiDepan").value),
                    ketinggianDariJalan: parseFloat(document.getElementById("ketinggianDariJalan").value) || 0,
                    bentukTanah: document.getElementById("bentukTanah").value,
                    dataKepemilikan: document.getElementById("dataKepemilikan").value,
                    namaPemilik: document.getElementById("namaPemilik").value,
                    luasBangunan: parseFloat(document.getElementById("luasBangunan").value) || 0,
                    nilaiDBKB: parseFloat(nilaiDBKBInput.value) || 0,
                    grade: document.getElementById("grade").value,
                    koordinat: document.getElementById("koordinat").value,
                };

                // 🔹 Kirim update ke Google Sheets
                fetch(GOOGLE_APPS_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...newProperti, action: "update" })
                })
                .then(res => res.text())
                .then(txt => {
                    console.log("Respon update:", txt);
                    // ✅ KRUSIAL: Muat ulang data setelah UPDATE sukses
                    loadFromGoogleSheets(); 
                })
                .catch(err => console.error("Gagal update ke Google Sheets:", err));
            }
            editModeId = null;

        } else {
            // 🔹 TAMBAH DATA BARU
            newProperti = {
                id: generateUUID(),
                alamatObjekPajak: document.getElementById("alamatObjekPajak").value,
                blokNop: document.getElementById("blokNop").value,
                kodeZNT: document.getElementById("kodeZNT").value,
                sumber: document.getElementById("sumber").value,
                jenis: document.getElementById("jenis").value,
                tanggal: document.getElementById("tanggal").value,
                hargaTransaksi: parseFloat(document.getElementById("hargaTransaksi").value),
                jenisPenggunaan: document.getElementById("jenisPenggunaan").value,
                luas: parseFloat(document.getElementById("luas").value),
                lebarSisiDepan: parseFloat(document.getElementById("lebarSisiDepan").value),
                ketinggianDariJalan: parseFloat(document.getElementById("ketinggianDariJalan").value) || 0,
                bentukTanah: document.getElementById("bentukTanah").value,
                dataKepemilikan: document.getElementById("dataKepemilikan").value,
                namaPemilik: document.getElementById("namaPemilik").value,
                luasBangunan: parseFloat(document.getElementById("luasBangunan").value) || 0,
                nilaiDBKB: parseFloat(nilaiDBKBInput.value) || 0,
                grade: document.getElementById("grade").value,
                koordinat: document.getElementById("koordinat").value,
            };

            // 🔹 Kirim tambah ke Google Sheets (Ini sudah memanggil loadFromGoogleSheets di dalamnya)
            syncToGoogleSheets(newProperti);
        }

        // Bersihkan form (Ini tetap dipertahankan)
        propertiForm.reset();
        if (marker) { map.removeLayer(marker); marker = null; }
        koordinatInput.value = '';
    });
}

// --- Table Rendering (home.html specific) ---
function renderPropertiTable() {
    if (!propertiTableBody) return;

    propertiTableBody.innerHTML = '';
    if (propertis.length === 0) {
        propertiTableBody.innerHTML = '<tr><td colspan="19">Belum ada data properti yang ditambahkan.</td></tr>';
        return;
    }

    propertis.forEach((data, index) => {
        const row = propertiTableBody.insertRow();
        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = data.alamatObjekPajak;
        row.insertCell().textContent = data.blokNop;
        row.insertCell().textContent = data.kodeZNT;
        row.insertCell().textContent = data.sumber;
        row.insertCell().textContent = data.jenis;
        row.insertCell().textContent = data.dataKepemilikan;
        row.insertCell().textContent = data.tanggal;
        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(data.hargaTransaksi);
        row.insertCell().textContent = data.jenisPenggunaan;
        row.insertCell().textContent = data.luas;
        row.insertCell().textContent = data.lebarSisiDepan;
        row.insertCell().textContent = data.ketinggianDariJalan;
        row.insertCell().textContent = data.bentukTanah;
        row.insertCell().textContent = data.namaPemilik;
        row.insertCell().textContent = data.luasBangunan;
        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(data.nilaiDBKB);
        row.insertCell().textContent = data.grade;
        row.insertCell().textContent = data.koordinat;

        const actionCell = row.insertCell();
        actionCell.classList.add('action-buttons');

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-btn');
        editButton.onclick = () => editProperti(data.id);
        actionCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-btn');
        deleteButton.onclick = () => deleteProperti(data.id);
        actionCell.appendChild(deleteButton);
    });
}

// --- Edit/Delete Functions (home.html specific) ---
function editProperti(id) {
    const propertiToEdit = propertis.find(p => p.id === id);
    if (propertiToEdit) {
        document.getElementById("alamatObjekPajak").value = propertiToEdit.alamatObjekPajak;
        document.getElementById("blokNop").value = propertiToEdit.blokNop;
        document.getElementById("kodeZNT").value = propertiToEdit.kodeZNT;
        document.getElementById("sumber").value = propertiToEdit.sumber;
        document.getElementById("jenis").value = propertiToEdit.jenis;
        document.getElementById("tanggal").value = propertiToEdit.tanggal;
        document.getElementById("hargaTransaksi").value = propertiToEdit.hargaTransaksi;
        document.getElementById("jenisPenggunaan").value = propertiToEdit.jenisPenggunaan;
        document.getElementById("luas").value = propertiToEdit.luas;
        document.getElementById("lebarSisiDepan").value = propertiToEdit.lebarSisiDepan;
        document.getElementById("ketinggianDariJalan").value = propertiToEdit.ketinggianDariJalan;
        document.getElementById("bentukTanah").value = propertiToEdit.bentukTanah;
        document.getElementById("dataKepemilikan").value = propertiToEdit.dataKepemilikan;
        document.getElementById("namaPemilik").value = propertiToEdit.namaPemilik;
        document.getElementById("luasBangunan").value = propertiToEdit.luasBangunan;
        nilaiDBKBInput.value = propertiToEdit.nilaiDBKB;
        document.getElementById("grade").value = propertiToEdit.grade;
        document.getElementById("koordinat").value = propertiToEdit.koordinat;
        editModeId = id;

        if (propertiToEdit.koordinat && map) {
            const [lat, lng] = propertiToEdit.koordinat.split(', ').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                map.setView([lat, lng], 16);
                if (marker) map.removeLayer(marker);
                marker = L.marker([lat, lng]).addTo(map);
            }
        }
    }
}

// --- Edit/Delete Functions (home.html specific) ---

// ... (Fungsi editProperti tetap sama)

function deleteProperti(id) {
    const modalMessage = "Apakah Anda yakin ingin menghapus data ini?";
    const modal = createModal(modalMessage, () => {
        // Hapus dari localStorage dan array lokal (sementara)
        propertis = propertis.filter(p => p.id !== id);
        localStorage.setItem('propertiData', JSON.stringify(propertis));
        renderPropertiTable(); // Render lokal untuk feedback cepat

        // Kirim permintaan hapus ke Google Sheets
        syncDeleteToGoogleSheets(id);

        closeModal(modal);
    });
}

// Fungsi untuk mengirim permintaan Hapus ke Apps Script
function syncDeleteToGoogleSheets(id) {
    // ⚠️ Pastikan ini adalah fungsi ini yang Anda gunakan, dan hapus duplikat lainnya!
    fetch(GOOGLE_APPS_SCRIPT_URL + "?action=delete&id=" + id, {
        method: "GET", 
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.text();
    })
    .then(txt => {
        console.log("Respon server Hapus:", txt);
        // ✅ Setelah sukses, muat ulang data dari Sheets untuk memastikan sinkronisasi penuh
        loadFromGoogleSheets(); 
    })
    .catch(err => {
        console.error("Gagal hapus dari Google Sheets:", err);
        // 🚨 Jika gagal, panggil ulang loadFromGoogleSheets() untuk menarik kembali data yang gagal dihapus dari Sheets
        loadFromGoogleSheets(); 
        createModal("Gagal menghapus data dari server. Silakan coba lagi.", () => {}); // Beri notifikasi ke user
    });
}

// --- Modal Kustom (untuk mengganti alert/confirm) ---
function createModal(message, onConfirm) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center';

    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white p-6 rounded-lg shadow-lg max-w-sm mx-auto';
    modalContainer.appendChild(modalContent);

    const messageEl = document.createElement('p');
    messageEl.className = 'text-gray-800 text-lg mb-4';
    messageEl.textContent = message;
    modalContent.appendChild(messageEl);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex justify-end space-x-2';
    modalContent.appendChild(buttonContainer);

    const cancelButton = document.createElement('button');
    cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300';
    cancelButton.textContent = 'Batal';
    cancelButton.onclick = () => closeModal(modalContainer);
    buttonContainer.appendChild(cancelButton);

    const confirmButton = document.createElement('button');
    confirmButton.className = 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300';
    confirmButton.textContent = 'Hapus';
    confirmButton.onclick = onConfirm;
    buttonContainer.appendChild(confirmButton);

    document.body.appendChild(modalContainer);
    return modalContainer;
}

function closeModal(modal) {
    modal.remove();
}

// --- Dropdown Population ---
function populateGradeDropdown() {
    if (!gradeSelect) return;

    for (let i = 1; i <= 10; i++) {
        const option = document.createElement("option");
        option.value = `Grade ${i}`;
        option.textContent = `Grade ${i}`;
        gradeSelect.appendChild(option);
    }
}

// =========================================================================
// --- Formulir 2 Specific JavaScript ---
// =========================================================================
function renderAnalisisTable() {
    const analisisTableBody = document.getElementById("analisisTableBody");
    if (!analisisTableBody) return;

    analisisTableBody.innerHTML = '';
    const storedPropertis = JSON.parse(localStorage.getItem('propertiData')) || [];

    if (storedPropertis.length === 0) {
        analisisTableBody.innerHTML = '<tr><td colspan="15">Belum ada data properti yang ditambahkan.</td></tr>';
        return;
    }

    storedPropertis.forEach((data, index) => {
        const row = analisisTableBody.insertRow();

        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = data.alamatObjekPajak;
        row.insertCell().textContent = data.blokNop;
        row.insertCell().textContent = data.kodeZNT
        row.insertCell().textContent = data.luas;
        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(data.hargaTransaksi);
        row.insertCell().textContent = data.jenis;
        row.insertCell().textContent = data.tanggal;

        const jenisAdjusted = calculateJenisAdjusted(data.jenis);
        row.insertCell().textContent = jenisAdjusted;

        const waktuAdjusted = calculateWaktuAdjusted(data.tanggal);
        row.insertCell().textContent = waktuAdjusted;

        const hargaWajar = calculateHargaWajar(
            data.hargaTransaksi,
            jenisAdjusted,
            waktuAdjusted
        );

        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(hargaWajar);

        row.insertCell().textContent = data.luasBangunan;

        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(data.nilaiDBKB);

        const selisihNilai = hargaWajar - data.nilaiDBKB;
        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(selisihNilai);

        const hargaWajarPerM2 = data.luas > 0 ? (hargaWajar - data.nilaiDBKB) / data.luas : 0;
        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(hargaWajarPerM2);
    });
}

// =========================================================================
// --- Formulir 3 Specific JavaScript ---
// =========================================================================
function renderAnalisisTable3() {
    if (!analisisTableBody3) return;

    analisisTableBody3.innerHTML = '';
    const storedPropertis = JSON.parse(localStorage.getItem('propertiData')) || [];
    const targetGrade = parseInt(gradeInputJudul.value);

    if (storedPropertis.length === 0) {
        analisisTableBody3.innerHTML = '<tr><td colspan="11">Belum ada data properti yang ditambahkan.</td></tr>';
        return;
    }

    let totalHargaWajarPerM2 = 0;
    let validCount = 0;

    storedPropertis.forEach(data => {
        const jenisAdjusted = calculateJenisAdjusted(data.jenis);
        const waktuAdjusted = calculateWaktuAdjusted(data.tanggal);

        const hargaWajar = calculateHargaWajar(
            data.hargaTransaksi,
            jenisAdjusted,
            waktuAdjusted
        );

        const hargaWajarPerM2 = data.luas > 0 ? (hargaWajar - data.nilaiDBKB) / data.luas : 0;

        if (hargaWajarPerM2 > 0) {
            totalHargaWajarPerM2 += hargaWajarPerM2;
            validCount++;
        }
    });

    const rataRataHargaWajarM2 = validCount > 0 ? totalHargaWajarPerM2 / validCount : 0;

    storedPropertis.forEach((data, index) => {
        const row = analisisTableBody3.insertRow();

        const jenisAdjusted = calculateJenisAdjusted(data.jenis);
        const kepemilikanAdjusted = calculateDataKepemilikanAdjusted(data.dataKepemilikan);
        const bentukTanahAdjusted = calculateBentukTanahAdjusted(data.bentukTanah);
        const ketinggianValue = data.ketinggianDariJalan !== undefined && data.ketinggianDariJalan !== null ? data.ketinggianDariJalan : 0;

        const hargaWajar = calculateHargaWajar(
            data.hargaTransaksi,
            jenisAdjusted,
            calculateWaktuAdjusted(data.tanggal)
        );

        const ketinggianAdjusted = calculateKetinggianAdjusted(ketinggianValue, data.luas, hargaWajar);

        // Nilai selisih yang digunakan sebagai input untuk rumus Nilai Wajar Objek
        const selisihNilai = data.luas > 0 ? (hargaWajar - data.nilaiDBKB) : 0;

        const hargaWajarPerM2 = data.luas > 0 ? selisihNilai / data.luas : 0;

        const gradeNumber = data.grade ? parseInt(data.grade.replace('Grade ', '')) : 0;

        // Logika baru untuk Lokasi (bakal grade)
        let lokasiBakalGrade;
        if (gradeNumber === targetGrade) {
            lokasiBakalGrade = 0;
        } else if (gradeNumber < targetGrade) {
            lokasiBakalGrade = gradeNumber / targetGrade;
        } else {
            lokasiBakalGrade = targetGrade / gradeNumber;
        }

        const nilaiWajarObjek3 = calculateHargaWajarform3(
            selisihNilai,
            lokasiBakalGrade,
            bentukTanahAdjusted,
            ketinggianAdjusted,
            kepemilikanAdjusted
        );

        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = data.alamatObjekPajak;
        row.insertCell().textContent = data.blokNop;
        row.insertCell().textContent = data.kodeZNT;
        row.insertCell().textContent = data.grade;
        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(hargaWajarPerM2);
        row.insertCell().textContent = lokasiBakalGrade.toFixed(2);
        row.insertCell().textContent = bentukTanahAdjusted;
        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(ketinggianAdjusted);
        row.insertCell().textContent = kepemilikanAdjusted;
        
        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(nilaiWajarObjek3);
        
        row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(rataRataHargaWajarM2);
    });
}
// === Analisis.html (Analisis ZNT) - REPLACE THIS BLOCK IN script.js ===
document.addEventListener('DOMContentLoaded', () => {
    const analisisTable = document.getElementById("analisisDataTable5");
    if (!analisisTable) {
        console.error("Elemen tabel analisis tidak ditemukan!");
        return;
    }

    const alamatObjekInput = document.getElementById("alamatObjekInput");
    const alamatDesaInput = document.getElementById("alamatDesaInput");
    const kodeZNTInput = document.getElementById("kodeZNTInput");
    const gradeInputDropdown = document.getElementById("gradeInputDropdown");

    const alamatSelects = [
        document.getElementById("alamat1Select"),
        document.getElementById("alamat2Select"),
        document.getElementById("alamat3Select"),
        document.getElementById("alamat4Select"),
        document.getElementById("alamat5Select")
    ];

    const showAnalysisBtn = document.getElementById("showAnalysisBtn");
    const analisisTableBody5 = document.getElementById("analisisTableBody5");
    const tableContainer = document.querySelector(".table-container");

    // Ambil data properti dan referensi dari localStorage (atau kosong)
    let propertis = [];
    try {
        const data = localStorage.getItem("propertiData");
        propertis = data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Gagal memuat data properti:", e);
        propertis = [];
    }
    const dataReferensiLocal = JSON.parse(localStorage.getItem('dataReferensi')) || {};

    // Isi dropdown alamat pembanding
    alamatSelects.forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">-- Pilih Alamat --</option>';
        propertis.forEach(p => {
            if (p.id && p.alamatObjekPajak) {
                const option = document.createElement("option");
                option.value = p.id;
                option.textContent = p.alamatObjekPajak;
                select.appendChild(option);
            }
        });
    });

    // Header hasil
    let resultHeader = document.getElementById("analysisResultHeader");
    if (!resultHeader) {
        resultHeader = document.createElement("h3");
        resultHeader.id = "analysisResultHeader";
        resultHeader.style.textAlign = "center";
        resultHeader.style.marginTop = "1rem";
        resultHeader.style.marginBottom = "1rem";
        resultHeader.textContent = "Pilih data untuk memulai Analisis ZNT";
        if (tableContainer && tableContainer.parentNode) {
            tableContainer.parentNode.insertBefore(resultHeader, tableContainer);
        }
    }

    // Helper: baca grade (toleran ke format "Grade X" atau "X")
    function parseGrade(value) {
        if (value === null || value === undefined) return 0;
        const digits = String(value).match(/\d+/);
        return digits ? parseInt(digits[0], 10) : 0;
    }

    // Helper: hitung nilai wajar bumi per m2 menggunakan fungsi yang ada (jenis + waktu)
    function computeNilaiWajarBumiPerM2(dataItem) {
        // Gunakan fungsi calculateJenisAdjusted, calculateWaktuAdjusted, calculateHargaWajar yang sudah ada
        const jenisAdjusted = calculateJenisAdjusted(dataItem.jenis);
        const waktuAdjusted = calculateWaktuAdjusted(dataItem.tanggal);
        const hargaWajar = calculateHargaWajar(dataItem.hargaTransaksi, jenisAdjusted, waktuAdjusted);
        const luas = parseFloat(dataItem.luas) || 0;
        const nilaiDBKB = parseFloat(dataItem.nilaiDBKB) || 0;
        if (luas > 0) {
            return (hargaWajar - nilaiDBKB) / luas;
        }
        return 0;
    }

    // Aksi tombol "Nilai"
    if (showAnalysisBtn) {
        showAnalysisBtn.addEventListener("click", () => {
            analisisTableBody5.innerHTML = "";

            const objekAlamat = (alamatObjekInput && alamatObjekInput.value.trim()) || '';
            const objekDesa = (alamatDesaInput && alamatDesaInput.value.trim()) || '';
            const objekKodeZNT = (kodeZNTInput && kodeZNTInput.value.trim()) || '';
            const objekGrade = parseInt(gradeInputDropdown.value) || 0;

            if (!objekAlamat || isNaN(objekGrade) || objekGrade <= 0) {
                alert("Harap lengkapi Alamat dan Grade Lokasi objek yang akan dinilai (1-10).");
                return;
            }

            const selectedIds = alamatSelects.map(s => s ? s.value : '').filter(id => id);
            if (selectedIds.length === 0) {
                analisisTableBody5.innerHTML = `<tr><td colspan="12" class="text-center text-gray-500">Tidak ada objek pembanding yang dipilih.</td></tr>`;
                resultHeader.textContent = `Analisis untuk Objek: ${objekAlamat} - Harap pilih minimal satu pembanding.`;
                return;
            }

            resultHeader.innerHTML = `
                <b>Analisis alamat Objek yang dinilai:</b> ${objekAlamat}
                <br> <b>Desa :</b> ${objekDesa || '-'}
                <br> <b>ZNT : </b>${objekKodeZNT || '-'} 
                <br> <b>Grade:</b> ${objekGrade}
            `;

            let index = 0;
            let totalNilaiWajarObjekZNT = 0;
            let jumlahPembanding = 0;

            selectedIds.forEach(id => {
                const data = propertis.find(p => String(p.id) === String(id));
                if (!data) return;

                // Ambil grade pembanding
                const pembandingGrade = parseGrade(data.grade);

                // Lokasi (bakal grade) sesuai permintaan: (grade_objek - pembanding) * 0.1
                const lokasiBakalGrade = (objekGrade - pembandingGrade) * 0.1;

                // Bentuk tanah: Normal -> 0, else dari dataReferensi.penyesuaian_bentuk_tanah
                const bentukTanahAdjusted = (String(data.bentukTanah).toLowerCase().includes('normal')) ? 0 :
                    (dataReferensiLocal.penyesuaian_bentuk_tanah !== undefined ? parseFloat(dataReferensiLocal.penyesuaian_bentuk_tanah) : 0);

                // Ketinggian dari jalan: ketinggian * penyesuaian_ketinggian (referensi)
                // ✅ Ketinggian dari jalan (hasil: ketinggian_dari_jalan × penyesuaian dari tabel referensi)
                let ketinggianValue = parseFloat(data.ketinggianDariJalan);
                if (isNaN(ketinggianValue)) ketinggianValue = 0;

                let penyesuaianKetinggianRef = parseFloat(dataReferensiLocal.penyesuaian_ketinggian);
                if (isNaN(penyesuaianKetinggianRef)) penyesuaianKetinggianRef = 0;

                const ketinggianAdjusted = Number((ketinggianValue * penyesuaianKetinggianRef).toFixed(4)); // simpan 4 digit agar nilai kecil tidak hilang


                // Kepemilikan: SHM -> 0, else penyesuaian_sertifikat
                const kepemilikanAdjusted = (String(data.dataKepemilikan).toUpperCase() === 'SHM') ? 0 :
                    (dataReferensiLocal.penyesuaian_sertifikat !== undefined ? parseFloat(dataReferensiLocal.penyesuaian_sertifikat) : 0);

                // Nilai wajar bumi per m2: ambil dari perhitungan Formulir 2 (fungsi computeNilaiWajarBumiPerM2)
                const nilaiWajarBumiM2 = computeNilaiWajarBumiPerM2(data);

                // Nilai wajar objek / ZNT: sesuai permintaan — jumlah komponen (bukan (1+...))
                // nilai_wajar_objek_znt = nilaiWajarBumiM2 * lokasi + nilaiWajarBumiM2 * bentuk + nilaiWajarBumiM2 * ketinggian + nilaiWajarBumiM2 * kepemilikan
                const nilaiWajarObjekZNT = nilaiWajarBumiM2 * (lokasiBakalGrade + bentukTanahAdjusted + ketinggianAdjusted + kepemilikanAdjusted);

                // Tambah ke total untuk rekonsiliasi
                totalNilaiWajarObjekZNT += nilaiWajarObjekZNT;
                jumlahPembanding++;

                // Nilai Wajar Transaksi per m2 (dari Formulir 2) -- tampilkan angka terformat
                const hargaWajarPerM2Display = isFinite(nilaiWajarBumiM2) ? nilaiWajarBumiM2 : 0;

                // Tulis baris tabel
                const row = analisisTableBody5.insertRow();
                row.insertCell().textContent = ++index;
                row.insertCell().textContent = data.alamatObjekPajak || "-";
                row.insertCell().textContent = data.blokNop || "-";
                row.insertCell().textContent = data.kodeZNT || "-";
                row.insertCell().textContent = data.grade || "-";
                row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(hargaWajarPerM2Display);
                row.insertCell().textContent = lokasiBakalGrade.toFixed(2);
                row.insertCell().textContent = bentukTanahAdjusted.toFixed(2);
                row.insertCell().textContent = ketinggianAdjusted.toFixed(4);
                row.insertCell().textContent = kepemilikanAdjusted.toFixed(2);
                row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(nilaiWajarObjekZNT);
                // nilai rekonsiliasi sementara: rata-rata sampai baris ini (kita bisa juga tampilkan akhir setelah loop)
                const rataRataSaatIni = jumlahPembanding > 0 ? totalNilaiWajarObjekZNT / jumlahPembanding : 0;
                row.insertCell().textContent = new Intl.NumberFormat('id-ID').format(rataRataSaatIni);
            });

            // Jika ingin menampilkan nilai rekonsiliasi final di footer / baris tersendiri:
            if (jumlahPembanding === 0) {
                // nothing
            } else {
                // (Opsional) tambahkan baris ringkasan di bawah tabel (hapus komentar jika ingin)
                /*
                const summaryRow = analisisTableBody5.insertRow();
                summaryRow.insertCell().textContent = '';
                summaryRow.insertCell().textContent = 'Rata-rata Rekonsiliasi';
                summaryRow.insertCell().colSpan = 9; // sesuaikan spasi
                summaryRow.insertCell().textContent = '';
                summaryRow.insertCell().textContent = new Intl.NumberFormat('id-ID').format(totalNilaiWajarObjekZNT / jumlahPembanding);
                */
            }
        });
    }
});

// =========================================================================
// --- Fungsi Perhitungan ---
// =========================================================================

function calculateJenisAdjusted(jenis) {
    const penyesuaianPenawaran = dataReferensi.penyesuaian_penawaran !== undefined ? dataReferensi.penyesuaian_penawaran : 0.9;
    const penyesuaianLelang = dataReferensi.penyesuaian_lelang !== undefined ? dataReferensi.penyesuaian_lelang : 0.75;
    const penyesuaianAgunan = dataReferensi.penyesuaian_agunan !== undefined ? dataReferensi.penyesuaian_agunan : 0.85;
    const penyesuaianKeterangan = dataReferensi.penyesuaian_keterangan !== undefined ? dataReferensi.penyesuaian_keterangan : 0.95;

    switch (jenis) {
        case 'Penawaran': return penyesuaianPenawaran;
        case 'Lelang': return penyesuaianLelang;
        case 'Agunan Bank': return penyesuaianAgunan;
        case 'Keterangan RT/RW/Lurah': return penyesuaianKeterangan;
        default: return 1;
    }
}

function calculateDataKepemilikanAdjusted(kepemilikan) {
    const penyesuaianSertifikat = dataReferensi.penyesuaian_sertifikat !== undefined ? dataReferensi.penyesuaian_sertifikat : 0.9;

    if (kepemilikan === 'SHM') {
        return 0;
    }
    if (kepemilikan === 'Girik/Belum SHM' || kepemilikan === 'AJB') {
        return penyesuaianSertifikat;
    }
    return 0;
}

function calculateKetinggianAdjusted(ketinggianDariJalan, luas, hargaWajar) {
    const hargaUrug = dataReferensi.harga_tanah_urug !== undefined ? dataReferensi.harga_tanah_urug : 200000;

    if (ketinggianDariJalan > 0 && hargaWajar > 0) {
        const adjustedValue = (ketinggianDariJalan * hargaUrug) * luas / hargaWajar;
        return adjustedValue;
    }
    return 0;
}

function calculateBentukTanahAdjusted(bentukTanah) {
    const penyesuaianBentukTanah = dataReferensi.penyesuaian_bentuk_tanah !== undefined ? dataReferensi.penyesuaian_bentuk_tanah : 0.9;

    if (bentukTanah === 'Normal') {
        return 0;
    }
    if (bentukTanah === 'Tidak Beraturan/Ngantong') {
        return penyesuaianBentukTanah;
    }
    return 0;
}

function calculateWaktuAdjusted(tanggalString) {
    const kenaikanPerBulan = dataReferensi.kenaikan_per_bulan !== undefined ? dataReferensi.kenaikan_per_bulan : 0;
    const currentDate = new Date();
    const inputDate = new Date(tanggalString);

    if (isNaN(inputDate.getTime())) return 0;

    let months;
    months = (currentDate.getFullYear() - inputDate.getFullYear()) * 12;
    months -= inputDate.getMonth();
    months += currentDate.getMonth();

    if (currentDate.getDate() < inputDate.getDate()) {
        months--;
    }

    if (months < 0) return 0;

    const adjustedValue = kenaikanPerBulan * months;

    return adjustedValue;
}

function calculateHargaWajar(
    hargaTransaksi,
    jenisAdjusted,
    waktuAdjusted
) {
    const baseHarga = parseFloat(hargaTransaksi);

    if (isNaN(baseHarga) || baseHarga <= 0) {
        return 0;
    }

    const totalHarga = baseHarga * (1 + jenisAdjusted + waktuAdjusted);

    return Math.max(0, totalHarga);
}

function calculateHargaWajarform3(
    selisihNilai,
    lokasiBakalGrade,
    bentukTanahAdjusted,
    ketinggianAdjusted,
    kepemilikanAdjusted
) {
  // Hitung setiap komponen penyesuaian
  const penyesuaianLokasi3 = selisihNilai * lokasiBakalGrade;
  const penyesuaianBentukTanah3 = selisihNilai * bentukTanahAdjusted;
  const penyesuaianKetinggianTanah3 = selisihNilai * ketinggianAdjusted;
  const penyesuaianKepemilikan3 = selisihNilai * kepemilikanAdjusted;

  // Terapkan rumus untuk mendapatkan Nilai Wajar Objek/ZNT3
  const nilaiWajarObjek3 =
    selisihNilai -
    penyesuaianLokasi3 +
    penyesuaianBentukTanah3 +
    penyesuaianKetinggianTanah3 +
    penyesuaianKepemilikan3;

  return nilaiWajarObjek3;
}

// --- Fungsi Ekspor Tabel ke CSV ---
function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) {
        // Menggunakan modal kustom sebagai pengganti alert
        createModal(`Tabel dengan ID "${tableId}" tidak ditemukan.`, () => {});
        return;
    }

    const rows = table.querySelectorAll('tr');
    let csv = [];

    for (const row of rows) {
        const cells = row.querySelectorAll('th, td');
        const rowData = [];

        cells.forEach(cell => {
            let text = cell.innerText.replace(/"/g, '""');
            if (text.includes(',') || text.includes('\n') || text.includes('"')) {
                text = `"${text}"`;
            }
            rowData.push(text);
        });
        csv.push(rowData.join(','));
    }

    const csvString = csv.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  // --- HOME (index.html) ---
  if (propertiForm) {
    populateGradeDropdown();
    initializeMap();
    loadReferenceData();
    loadFromGoogleSheets(); // Ambil data dari Sheets saat load
    referenceInputs.forEach(input => input.addEventListener('change', saveReferenceData));
    if (exportHomeTableBtn) {
      exportHomeTableBtn.addEventListener('click', () => {
        exportTableToCSV('propertiDataTable', 'data_properti_input.csv');
      });
    }
  }

  // --- FORMULIR 2 ---
  if (document.getElementById("analisisDataTable")) {
    dataReferensi = JSON.parse(localStorage.getItem('dataReferensi')) || {};
    propertis = JSON.parse(localStorage.getItem('propertiData')) || [];
    
    // 🔹 Render langsung dari localStorage dulu agar tampil instan
    renderAnalisisTable();

    // 🔹 Lalu ambil versi terbaru dari Google Sheets (jaga sinkronisasi)
    loadFromGoogleSheets();

    if (exportTable2Btn) {
      exportTable2Btn.addEventListener('click', () => {
        exportTableToCSV('analisisDataTable', 'analisis_nilai_pasar_wajar.csv');
      });
    }
  }

  // --- FORMULIR 3 ---
  if (analisisTable3) {
    dataReferensi = JSON.parse(localStorage.getItem('dataReferensi')) || {};
    propertis = JSON.parse(localStorage.getItem('propertiData')) || [];

    // 🔹 Render langsung dari localStorage
    renderAnalisisTable3();

    // 🔹 Sinkronkan lagi dari Google Sheets
    loadFromGoogleSheets();

    if (gradeInputJudul) {
      gradeInputJudul.addEventListener('change', renderAnalisisTable3);
      gradeInputJudul.addEventListener('input', renderAnalisisTable3);
    }
    if (exportTable3Btn) {
      exportTable3Btn.addEventListener('click', () => {
        exportTableToCSV('analisisDataTable3', 'analisis_rekonsiliasi.csv');
      });
    }
  }
});










