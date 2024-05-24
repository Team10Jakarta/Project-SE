fetch('https://raw.githubusercontent.com/Ari050/NYCdataset/main/NYC.json')
    .then(response => response.json())
    .then(data => {
        const salesData = { lineData: {}, lineDatat: {}, barData: {}, priceRangeData: {}, tableData: {} };
        processData(data, salesData);
        populateFilters(data);
        createLineChart('chart1', salesData.lineData);
        createPriceRangePieChart('chart2', salesData.priceRangeData);
        createUnitsLineChart('chart3', salesData);
        createBarChart('chart4', salesData.barData);
        createTableChart('chart5', salesData.tableData);
    })
    .catch(error => console.error('Error fetching data:', error));

function populateFilters(data) {
    const boroughSet = new Set();
    const neighborhoodSet = new Set();
    const buildingClassSet = new Set();

    data.forEach(item => {
        boroughSet.add(item.BOROUGH);
        neighborhoodSet.add(item.NEIGHBORHOOD);
        buildingClassSet.add(item.BUILDING_CLASS_CATEGORY);
    });

    const sortedBoroughs = Array.from(boroughSet).sort();
    const sortedNeighborhoods = Array.from(neighborhoodSet).sort();
    const sortedBuildingClasses = Array.from(buildingClassSet).sort();

    const boroughFilter = document.getElementById('boroughFilter');
    sortedBoroughs.forEach(borough => {
        const option = document.createElement('option');
        option.value = borough;
        option.textContent = borough;
        boroughFilter.appendChild(option);
    });

    const neighborhoodFilter = document.getElementById('neighborhood');
    sortedNeighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.value = neighborhood;
        option.textContent = neighborhood;
        neighborhoodFilter.appendChild(option);
    });

    const buildingClassFilter = document.getElementById('buildingClass');
    sortedBuildingClasses.forEach(buildingClass => {
        const option = document.createElement('option');
        option.value = buildingClass;
        option.textContent = buildingClass;
        buildingClassFilter.appendChild(option);
    });
}

//Proses data untuk setiap chart
function processData(data, salesData) {
    const salesByBorough = {};
    const salesCounts = {};
    const buildingCategoryCounts = {};
    const salesByNeighborhood = {};
    const priceRanges = {
        "0 - 20": 0,
        "20 - 100.000": 0,
        "100.000 - 10.000.000": 0,
        "10.000.000 - 1.000.000.000": 0,
        "> 1.000.000.000": 0
    };

    const residentialUnits = {};
    const commercialUnits = {};

    data.forEach(item => {
        const neighborhood = item.NEIGHBORHOOD;
        const borough = item.BOROUGH;
        const category = item.BUILDING_CLASS_CATEGORY;
        const saleDate = new Date(item.SALE_DATE);
        const salePrice = parseFloat(item.SALE_PRICE);
        const monthYear = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}`;
        const resUnits = parseInt(item.RESIDENTIAL_UNITS, 10) || 0;
        const comUnits = parseInt(item.COMMERCIAL_UNITS, 10) || 0;

        // Process data for Total Sales in Each Borough by Month (Chart 1)
        if (!salesByBorough[borough]) {
            salesByBorough[borough] = {};
        }
        if (!salesByBorough[borough][monthYear]) {
            salesByBorough[borough][monthYear] = 0;
        }
        salesByBorough[borough][monthYear]++;

        // Process data for Sales Distribution by Price Range (Chart 2)
        if (salePrice > 0 && salePrice <= 20) {
            priceRanges["0 - 20"]++;
        } else if (salePrice > 20 && salePrice <= 100000) {
            priceRanges["20 - 100.000"]++;
        } else if (salePrice > 100000 && salePrice <= 10000000) {
            priceRanges["100.000 - 10.000.000"]++;
        } else if (salePrice > 10000000 && salePrice <= 1000000000) {
            priceRanges["10.000.000 - 1.000.000.000"]++;
        } else if (salePrice > 1000000000) {
            priceRanges["> 1.000.000.000"]++;
        }

        // Process data for Sales of Residential and Commercial Units by Month (Chart 3)
        if (!residentialUnits[monthYear]) {
            residentialUnits[monthYear] = 0;
        }
        residentialUnits[monthYear] += resUnits;

        if (!commercialUnits[monthYear]) {
            commercialUnits[monthYear] = 0;
        }
        commercialUnits[monthYear] += comUnits;

        // Process data for Total Sales by Building Class Category (Chart 4)
        if (!buildingCategoryCounts[category]) {
            buildingCategoryCounts[category] = 0;
        }
        buildingCategoryCounts[category]++;

        // Process data for Table of Total Sales by Neighborhood (Chart 5)
        if (!salesByNeighborhood[neighborhood]) {
            salesByNeighborhood[neighborhood] = 1;
        } else {
            salesByNeighborhood[neighborhood]++;
        }
    });

    // Prepare data for Total Sales in Each Borough by Month (Chart 1)
    const labels = Array.from(new Set(data.map(item => {
        const saleDate = new Date(item.SALE_DATE);
        return `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}`;
    }))).sort();

    const lineDatasets = Object.keys(salesByBorough).map(borough => {
        return {
            label: borough,
            data: labels.map(label => salesByBorough[borough][label] || 0),
            fill: false,
            borderColor: getRandomColor(),
            tension: 0.1
        };
    });

    // Prepare data for Sales Distribution by Price Range (Chart 2)
    const priceRangeData = {
        labels: Object.keys(priceRanges),
        datasets: [{
            data: Object.values(priceRanges),
            backgroundColor: Object.keys(priceRanges).map(() => getRandomColor())
        }]
    };

    // Prepare data for Sales of Residential and Commercial Units by Month (Chart 3)
    const lineDatat = {
        labels: labels,
        datasets: [
            {
                label: 'Residential Units',
                data: labels.map(label => residentialUnits[label] || 0),
                borderColor: getRandomColor(),
                fill: false,
                tension: 0.1
            },
            {
                label: 'Commercial Units',
                data: labels.map(label => commercialUnits[label] || 0),
                borderColor: getRandomColor(),
                fill: false,
                tension: 0.1
            }
        ]
    };

    // Sort buildingCategoryCounts by count in descending order
    const sortedBuildingCategoryCounts = Object.entries(buildingCategoryCounts).sort((a, b) => b[1] - a[1]);
    const sortedBuildingCategories = sortedBuildingCategoryCounts.map(entry => entry[0]);
    const sortedBuildingCounts = sortedBuildingCategoryCounts.map(entry => entry[1]);

    // Prepare data for Total Sales by Building Class Category (Chart 4)
    const barData = {
        labels: sortedBuildingCategories,
        datasets: [{
            label: null,
            data: sortedBuildingCounts,
            backgroundColor: sortedBuildingCategories.map(() => getRandomColor()),
        }]
    };

    // Prepare data for Table of Total Sales by Neighborhood (Chart 5)
    const tableData = Object.keys(salesByNeighborhood).map(neighborhood => ({
        neighborhood: neighborhood,
        totalSales: salesByNeighborhood[neighborhood]
    }));

    salesData.lineData = { labels, datasets: lineDatasets };
    salesData.lineDatat = lineDatat;
    salesData.barData = barData;
    salesData.priceRangeData = priceRangeData;
    salesData.tableData = tableData;
}

function createLineChart(chartId, lineData) {
    const chartContainer = document.getElementById(chartId).parentNode;
    const title = document.createElement('h3');
    title.textContent = 'Total Sales in Each Borough by Month';
    title.style.textAlign = 'center';
    title.style.color = 'white';
    chartContainer.insertBefore(title, chartContainer.firstChild);

    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: lineData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

function createBarChart(chartId, barData) {
    const chartContainer = document.getElementById(chartId).parentNode;
    const title = document.createElement('h3');
    title.textContent = 'Total Sales by Building Class Category';
    title.style.textAlign = 'center';
    title.style.color = 'white';
    chartContainer.insertBefore(title, chartContainer.firstChild);

    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: barData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false, // Hide legend to avoid showing the label
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'white'
                    }
                },
                y: {
                    ticks: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

function createPriceRangePieChart(chartId, priceRangeData) {
    const chartContainer = document.getElementById(chartId).parentNode;
    const title = document.createElement('h3');
    title.textContent = 'Sales Distribution by Price Range';
    title.style.textAlign = 'center';
    title.style.color = 'white';
    chartContainer.insertBefore(title, chartContainer.firstChild);

    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: priceRangeData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

function createUnitsLineChart(chartId, salesData) {
    const chartContainer = document.getElementById(chartId).parentNode;
    const title = document.createElement('h3');
    title.textContent = 'Sales of Residential and Commercial Units by Month';
    title.style.textAlign = 'center';
    title.style.color = 'white';
    chartContainer.insertBefore(title, chartContainer.firstChild);

    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: salesData.lineDatat,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'white'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'white'
                    }
                },
                y: {
                    ticks: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

function createTableChart(chartId, tableData) {
    // Sort the data by totalSales in descending order
    tableData.sort((a, b) => b.totalSales - a.totalSales);

    // Create the title element
    const title = document.createElement('h3');
    title.textContent = 'Most Property Sales by Neighborhood';
    title.style.textAlign = 'center';
    title.style.color = 'white';

    // Insert the title before the table
    const tableContainer = document.getElementById(chartId).parentNode;
    tableContainer.insertBefore(title, tableContainer.firstChild);

    const table = document.getElementById(chartId);
    let tbody = table.querySelector('tbody');
    if (!tbody) {
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
    }
    table.classList.add('custom-table');
    table.style.width = '500px';
    table.style.margin = 'auto';
    table.style.fontSize = '14px';
    table.style.borderCollapse = 'collapse';
    const rowsPerPage = 10;
    let currentIndex = 0;

    displayTableData(tableData, tbody, currentIndex, rowsPerPage);

    function displayTableData(data, tbody, startIndex, rowsPerPage) {
        tbody.innerHTML = '';
        const currentPageData = data.slice(startIndex, startIndex + rowsPerPage);
        currentPageData.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.neighborhood}</td>
                <td>${data.totalSales}</td>
            `;
            tbody.appendChild(row);
        });
        addPaginationButtons(data, tbody, startIndex, rowsPerPage);
    }

    function addPaginationButtons(data, tbody, startIndex, rowsPerPage) {
        const paginationContainer = document.querySelector('.pagination-container');
        if (paginationContainer) {
            paginationContainer.remove();
        }

        const newPaginationContainer = document.createElement('div');
        newPaginationContainer.classList.add('pagination-container');
        table.parentNode.appendChild(newPaginationContainer);

        const totalPages = Math.ceil(data.length / rowsPerPage);
        const currentPage = Math.floor(startIndex / rowsPerPage) + 1;

        const pageLabel = document.createElement('span');
        pageLabel.textContent = `${startIndex + 1} - ${Math.min(startIndex + rowsPerPage, data.length)} / ${data.length}`;
        newPaginationContainer.appendChild(pageLabel);

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.classList.add('pagination-button');
        prevButton.disabled = startIndex === 0;
        prevButton.addEventListener('click', () => {
            const newIndex = Math.max(startIndex - rowsPerPage, 0);
            currentIndex = newIndex;
            displayTableData(data, tbody, newIndex, rowsPerPage);
        });
        newPaginationContainer.appendChild(prevButton);

        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.classList.add('pagination-button');
        nextButton.disabled = startIndex + rowsPerPage >= data.length;
        nextButton.addEventListener('click', () => {
            const newIndex = Math.min(startIndex + rowsPerPage, data.length - rowsPerPage);
            currentIndex = newIndex;
            displayTableData(data, tbody, newIndex, rowsPerPage);
        });
        newPaginationContainer.appendChild(nextButton);
    }
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}