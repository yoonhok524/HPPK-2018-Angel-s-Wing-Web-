var config = {
    apiKey: "AIzaSyCAT2lggXn31BQBLIzWWpvr8muV8uxYMuQ",
    authDomain: "hppk-2018-angel-s-wing.firebaseapp.com",
    databaseURL: "https://hppk-2018-angel-s-wing.firebaseio.com",
    projectId: "hppk-2018-angel-s-wing",
    storageBucket: "hppk-2018-angel-s-wing.appspot.com",
    messagingSenderId: "136917003827"
};
firebase.initializeApp(config);
const firestore = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true };
firestore.settings(settings);
const storage = firebase.storage();

const chartOption = {
    responsive: false,
    maintainAspectRatio: false,
    scales: {
        yAxes: [{
            ticks: {
                beginAtZero: true
            }
        }]
    }
}

getProducts();

function removeAllChild(doc) {
    while (doc.hasChildNodes()) { doc.removeChild(doc.firstChild); }
}

function getProducts() {
    var root = document.getElementById("product_container");
    removeAllChild(root);

    var productList = [];
    firestore.collection("products").orderBy("createdAt", "desc").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);

            const product = doc.data();
            productList.push(product);

            var productImg = document.createElement("img");
            if (product.imgFileName == "ic_unknown.png") {
                productImg.className = "img-none";
            } else {
                productImg.className = "img-cover";
            }
            productImg.height = "348"

            var badge = document.createElement("span");
            badge.classList.add("badge");
            if (product.onSale) {
                badge.classList.add("badge-primary");
                badge.innerText = "판매중";
            } else {
                badge.classList.add("badge-danger");
                badge.innerText = "판매 완료";
            }

            // Product name
            var pCardTitle = document.createElement("h5");
            pCardTitle.className = "card-title"
            pCardTitle.innerText = product.name;

            // Price
            var pCardText = document.createElement("p");
            pCardText.className = "card-text"
            pCardText.innerText = product.price + "원";

            // Seller
            // Location
            var sellerContainer = document.createElement("div")
            sellerContainer.className = "seller-container"
            var location = document.createElement("span")
            location.className = "location"
            location.innerText = getLocation(product.seller.part)
            sellerContainer.appendChild(location)

            // name, lab, part
            var smallText = document.createElement("small")
            smallText.className = "text-muted";
            smallText.innerText = product.seller.name + "\n" + product.seller.lab + " | " + product.seller.part;
            sellerContainer.appendChild(smallText)

            var divCardBody = document.createElement("div");
            divCardBody.className = "card-body";
            divCardBody.appendChild(badge);
            divCardBody.appendChild(pCardTitle);
            divCardBody.appendChild(pCardText);
            divCardBody.appendChild(sellerContainer);

            var divCard = document.createElement("div");
            divCard.classList.add("card");
            divCard.classList.add("mb-4");
            divCard.classList.add("shadow-sm");
            divCard.appendChild(productImg);
            divCard.appendChild(divCardBody);

            var divRoot = document.createElement("div");
            divRoot.className = "col-md-4";
            divRoot.appendChild(divCard);
            divRoot.onclick = function () { showProductDetails(product); };

            root.appendChild(divRoot);

            storage.ref(product.imgFileName).getDownloadURL().then(function (url) {
                productImg.src = url;
            }).catch(function (error) {
                switch (error.code) {
                    case 'storage/object_not_found':
                        break;
                    case 'storage/unauthorized':
                        break;
                    case 'storage/canceled':
                        break;
                    case 'storage/unknown':
                        break;
                }
            });
        });

        $('#productSize').text("총 " + productList.length + "개의 물품이 등록되었습니다!");
        drawProductRegisterChart(productList);
        drawTop5SalesChart(productList);
        drawTop5DonationChart(productList);
    });
}

function drawProductRegisterChart(productList) {
    var salesList = []
    productList.forEach((product) => {
        var part = product.seller.part
        var p = salesList.find(element => {
            return element.part == part
        })

        if (p === undefined) {
            salesList.push({ part: part, count: 1 })
        } else {
            p.count++;
        }
    })

    salesList.sort((a, b) => {
        if (a.part < b.part)
            return -1;
        if (a.part > b.part)
            return 1;
        return 0;
    })

    const labelArr = salesList.map(value => value.part)
    const countArr = salesList.map(value => value.count)

    var ctx = document.getElementById("productRegisterChart").getContext('2d');
    new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: labelArr,
            datasets: [{
                label: '물품 등록 현황',
                data: countArr,
                backgroundColor: [
                    '#d5000099',
                    '#c5116299',
                    '#aa00ff99',
                    '#512da899',
                    '#303f9f99',
                    '#1976d299',
                    '#0288d199',
                    '#0097a799',
                    '#00796b99',
                    '#388e3c99',
                    '#64dd1799',
                    '#aeea0099',
                    '#ffd60099',
                    '#ffab0099',
                    '#f57c0099',
                    '#e64a1999',
                    '#79554899',
                    '#9e9e9e99',
                    '#607d8b99'
                ],
                borderColor: [
                    '#d50000',
                    '#c51162',
                    '#aa00ff',
                    '#512da8',
                    '#303f9f',
                    '#1976d2',
                    '#0288d1',
                    '#0097a7',
                    '#00796b',
                    '#388e3c',
                    '#64dd17',
                    '#aeea00',
                    '#ffd600',
                    '#ffab00',
                    '#f57c00',
                    '#e64a19',
                    '#795548',
                    '#9e9e9e',
                    '#607d8b'
                ],
                borderWidth: 1
            }]
        },
        options: chartOption
    });
}

function drawTop5SalesChart(productList) {
    const salesList = []
    productList.filter(product => !product.onSale)
        .forEach((product) => {
            const part = product.seller.part
            const p = salesList.find(element => {
                return element.part == part
            })

            if (p === undefined) {
                salesList.push({ part: part, count: 1 })
            } else {
                p.count++;
            }
        })

    const top5 = salesList.sort((a, b) => {
        return b.count - a.count
    }).slice(0, 5)

    const labelArr = top5.map(value => value.part)
    const countArr = top5.map(value => value.count)

    drawChart("top3Sales", "판매 금액", labelArr, countArr);
}

function drawTop5DonationChart(productList) {
    const donationList = []
    productList.filter(product => !product.onSale)
        .forEach((product) => {
            const part = product.seller.part
            const p = donationList.find(element => {
                return element.part == part
            })

            if (p === undefined) {
                donationList.push({ part: part, donation: product.donation })
            } else {
                p.donation += product.donation;
            }
        })

    const top5 = donationList.sort((a, b) => {
        return b.donation - a.donation
    }).slice(0, 5)

    const labelArr = top5.map(value => value.part)
    const donationArr = top5.map(value => value.donation)

    drawChart("top3Donation", "기부 금액", labelArr, donationArr);
}

function drawChart(chartId, label, labelArr, valueArr) {
    var ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labelArr,
            datasets: [{
                label: label,
                data: valueArr,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: chartOption
    });
}

function getLocation(part) {
    switch (part) {
        case "파트-이근철":
            return "판매 지역: A"
        case "파트-이기창":
            return "판매 지역: B"
        case "파트-허남":
            return "판매 지역: C"
        case "파트-하우화":
            return "판매 지역: D"
        case "파트-조태균":
            return "판매 지역: E"
        case "파트-이중목":
            return "판매 지역: F"
        case "파트-김행난":
            return "판매 지역: G"
        case "파트-강형종":
            return "판매 지역: H"
        case "파트-채수경":
            return "판매 지역: I"
        case "파트-김수동":
            return "판매 지역: J"
        case "파트-도대회":
            return "판매 지역: K"
        case "파트-김병유":
            return "판매 지역: L"
        case "파트-권용찬":
            return "판매 지역: M"
        case "파트-Mohamad":
            return "판매 지역: N"
        case "파트-심인보":
            return "판매 지역: O"
        case "파트-System Architect":
            return "판매 지역: P"
        case "파트-최준영":
            return "판매 지역: Q"
        default:
            return "판매 지역: All"
    }
}

function showProductDetails(product) {
    $('#registerProductModal').modal('show');

    $('#product-name').val(product.name);
    $('#product-price').val(product.price);
    if (product.donation) {
        $('#donation').val(product.donation)
    } else {
        $('#donation').val(parseInt(product.price * 0.4))
    }
    $('#seller-name').val(product.seller.name);
    $('#selectLab').val(product.seller.lab);
    onChangedLab();
    $('#selectPart').val(product.seller.part);
    $('#productId').val(product.id);
    $('#isOnSales').prop('checked', product.onSale);
    $('#btnDeleteProduct').css('visibility', 'visible');
}

function openAddModal() {
    $('#registerProductModal').modal('show');

    $('#product-name').val("");
    $('#product-price').val("0");
    $('#donation').val("0");
    $('#seller-name').val("");
    $('#selectLab').val("1랩");
    $('#selectPart').val("파트-하우화");
    $('#productId').val("");
    $('#isOnSales').attr('checked', product.onSale);

    $('#btnDeleteProduct').css('visibility', 'hidden');
}

function addProductWithPhoto() {
    console.log("[HPPK] addProduct");
    var originFileName = document.getElementById("productPhoto").value;
    var fileFormat = getFileFormat(originFileName);

    var photoFile = $('#productPhoto').get(0).files[0];
    var productName = document.getElementById("product-name").value;
    var productPrice = document.getElementById("product-price").value;
    var donation = document.getElementById('donation').value;
    var sellerName = document.getElementById("seller-name").value;
    var sellerLab = document.getElementById("selectLab").value;
    var sellerPart = document.getElementById("selectPart").value;
    var createdAt = new Date().getTime();

    const productId = sellerName + "_" + createdAt;
    const fileName = productId + "." + fileFormat;

    storage.ref(fileName).put(photoFile).then(function (snapshot) {
        console.log('[HPPK] addProduct - Uploaded a blob or file!');
        firestore.collection("products")
            .doc(productId).set({
                id: productId,
                createdAt: createdAt,
                imgFileName: fileName,
                name: productName,
                onSale: true,
                price: parseInt(productPrice),
                donation: parseInt(donation),
                seller: {
                    lab: sellerLab,
                    part: sellerPart,
                    name: sellerName
                }
            })
            .then(function () {
                console.log("[HPPK] addProduct - Document successfully written!");
                $('#registerProductModal').modal('hide');
                getProducts();
            })
            .catch(function (error) {
                console.error("[HPPK] addProduct - Error writing document: ", error);
                alert("Failed: " + error);
            });
    });
}

function addProduct() {
    console.log("[HPPK] addProduct");

    var productName = document.getElementById("product-name").value;
    var productPrice = document.getElementById("product-price").value;
    var donation = document.getElementById("donation").value;
    var sellerName = document.getElementById("seller-name").value;
    var sellerLab = document.getElementById("selectLab").value;
    var sellerPart = document.getElementById("selectPart").value;
    var createdAt = new Date().getTime();

    const productId = sellerName + "_" + createdAt;

    firestore.collection("products")
        .doc(productId).set({
            id: productId,
            createdAt: createdAt,
            imgFileName: "ic_unknown.png",
            name: productName,
            onSale: true,
            price: parseInt(productPrice),
            donation: parseInt(donation),
            seller: {
                lab: sellerLab,
                part: sellerPart,
                name: sellerName
            }
        })
        .then(function () {
            console.log("[HPPK] addProduct - Document successfully written!");
            $('#registerProductModal').modal('hide');
            getProducts();
        })
        .catch(function (error) {
            console.error("[HPPK] addProduct - Error writing document: ", error);
            alert("Failed: " + error);
        });
}

function editProduct() {
    console.log("[HPPK] editProduct");

    var productName = document.getElementById("product-name").value;
    var productPrice = document.getElementById("product-price").value;
    var donation = document.getElementById("donation").value;
    var sellerName = document.getElementById("seller-name").value;
    var sellerLab = document.getElementById("selectLab").value;
    var sellerPart = document.getElementById("selectPart").value;
    const isOnSales = document.getElementById("isOnSales").checked;

    const productId = $('#productId').val();

    firestore.collection("products")
        .doc(productId).set({
            name: productName,
            onSale: isOnSales,
            price: parseInt(productPrice),
            donation: parseInt(donation),
            seller: {
                lab: sellerLab,
                part: sellerPart,
                name: sellerName
            }
        }, { merge: true })
        .then(function () {
            console.log("[HPPK] editProduct - Document successfully written!");
            $('#registerProductModal').modal('hide');
            getProducts();
        })
        .catch(function (error) {
            console.error("[HPPK] editProduct - Error writing document: ", error);
            alert("Failed: " + error);
        });
}

function editProductWithPhoto() {
    console.log("[HPPK] editProductWithPhoto");
    var originFileName = document.getElementById("productPhoto").value;
    var fileFormat = getFileFormat(originFileName);

    var productName = document.getElementById("product-name").value;
    var productPrice = document.getElementById("product-price").value;
    var donation = document.getElementById("donation").value;
    var sellerName = document.getElementById("seller-name").value;
    var sellerLab = document.getElementById("selectLab").value;
    var sellerPart = document.getElementById("selectPart").value;
    const isOnSales = document.getElementById("isOnSales").checked;
    const productId = $('#productId').val();
    const fileName = productId + "." + fileFormat;

    storage.ref(fileName).delete().then(function () {
        var photoFile = $('#productPhoto').get(0).files[0];
        storage.ref(fileName).put(photoFile).then(function (snapshot) {
            console.log('[HPPK] editProductWithPhoto - Uploaded a blob or file!');
            firestore.collection("products")
                .doc(productId).set({
                    imgFileName: fileName,
                    name: productName,
                    onSale: isOnSales,
                    price: parseInt(productPrice),
                    donation: parseInt(donation),
                    seller: {
                        lab: sellerLab,
                        part: sellerPart,
                        name: sellerName
                    }
                }, { merge: true })
                .then(function () {
                    console.log("[HPPK] editProductWithPhoto - Document successfully written!");
                    $('#registerProductModal').modal('hide');
                    getProducts();
                })
                .catch(function (error) {
                    console.error("[HPPK] editProductWithPhoto - Error writing document: ", error);
                    alert("Failed: " + error);
                });
        });
    }).catch(function (error) {
        alert("Failed: " + error);
    });
}

function registerProduct() {
    const productId = $("#productId").val();
    const originFileName = document.getElementById("productPhoto").value;
    console.log("[HPPK] id: [" + productId + "]");

    if (productId.length == 0) {
        if (originFileName.length == 0) {
            addProduct();
        } else {
            addProductWithPhoto();
        }
    } else if (originFileName.length == 0) {
        editProduct();
    } else {
        editProductWithPhoto();
    }
}

function deleteProduct() {
    const productId = $('#productId').val();
    firestore.collection("products")
        .doc(productId)
        .get()
        .then(function (doc) {
            if (doc.exists) {
                const product = doc.data();
                const filename = product.imgFileName;
                if (filename != "ic_unknown.png") {
                    storage.ref(filename).delete().then(function () {
                        firestore.collection("products")
                            .doc(productId)
                            .delete().then(function () {
                                console.log("[HPPK] deleteProduct - Document successfully deleted!");
                                $('#registerProductModal').modal('hide');
                                getProducts();
                            }).catch(function (error) {
                                console.error("[HPPK] deleteProduct -Error removing document: ", error);
                            });
                    });
                } else {
                    firestore.collection("products")
                        .doc(productId)
                        .delete().then(function () {
                            console.log("[HPPK] deleteProduct - Document successfully deleted!");
                            $('#registerProductModal').modal('hide');
                            getProducts();
                        }).catch(function (error) {
                            console.error("[HPPK] deleteProduct -Error removing document: ", error);
                        });
                }
            } else {
                alert("Failed - The product already removed.");
            }
        }).catch(function (error) {
            alert("Failed");
        });
}

function getFileFormat(filename) {
    const tokens = filename.split(".");
    return tokens[tokens.length - 1];
}

function onChangedLab() {
    var lab = document.getElementById("selectLab").value;
    var selectPart = document.getElementById("selectPart");
    removeAllChild(selectPart);

    if (lab == "1랩") {
        var part1 = document.createElement("option");
        part1.value = "파트-하우화";
        part1.innerText = "파트-하우화"
        selectPart.appendChild(part1);

        var part2 = document.createElement("option");
        part2.value = "파트-이근철";
        part2.innerText = "파트-이근철"
        selectPart.appendChild(part2);

        var part3 = document.createElement("option");
        part3.value = "파트-이중목";
        part3.innerText = "파트-이중목"
        selectPart.appendChild(part3);

        var part4 = document.createElement("option");
        part4.value = "파트-이기창";
        part4.innerText = "파트-이기창"
        selectPart.appendChild(part4);

        var part5 = document.createElement("option");
        part5.value = "파트-Mohamad";
        part5.innerText = "파트-Mohamad"
        selectPart.appendChild(part5);

        var part6 = document.createElement("option");
        part6.value = "파트-정진태";
        part6.innerText = "파트-정진태"
        selectPart.appendChild(part6);
    } else if (lab == "2랩") {
        var part1 = document.createElement("option");
        part1.value = "파트-조태균";
        part1.innerText = "파트-조태균"
        selectPart.appendChild(part1);

        var part2 = document.createElement("option");
        part2.value = "파트-허남";
        part2.innerText = "파트-허남"
        selectPart.appendChild(part2);

        var part3 = document.createElement("option");
        part3.value = "파트-김병유";
        part3.innerText = "파트-김병유"
        selectPart.appendChild(part3);

        var part4 = document.createElement("option");
        part4.value = "파트-채수경";
        part4.innerText = "파트-채수경"
        selectPart.appendChild(part4);

        var part5 = document.createElement("option");
        part5.value = "파트-김행난";
        part5.innerText = "파트-김행난"
        selectPart.appendChild(part5);
    } else if (lab == "솔루션랩") {
        var part1 = document.createElement("option");
        part1.value = "파트-강형종";
        part1.innerText = "파트-강형종"
        selectPart.appendChild(part1);

        var part2 = document.createElement("option");
        part2.value = "파트-권용찬";
        part2.innerText = "파트-권용찬"
        selectPart.appendChild(part2);

        var part3 = document.createElement("option");
        part3.value = "파트-김수동";
        part3.innerText = "파트-김수동"
        selectPart.appendChild(part3);

        var part4 = document.createElement("option");
        part4.value = "파트-최준영";
        part4.innerText = "파트-최준영"
        selectPart.appendChild(part4);
    } else if (lab == "그룹") {
        var part1 = document.createElement("option");
        part1.value = "파트-심인보";
        part1.innerText = "파트-심인보"
        selectPart.appendChild(part1);

        var part2 = document.createElement("option");
        part2.value = "파트-도대회";
        part2.innerText = "파트-도대회"
        selectPart.appendChild(part2);

        var part3 = document.createElement("option");
        part3.value = "파트-System Architect";
        part3.innerText = "파트-System Architect"
        selectPart.appendChild(part3);
    } else {
        var part4 = document.createElement("option");
        part4.value = "All";
        part4.innerText = "All"
        selectPart.appendChild(part4);
    }
}