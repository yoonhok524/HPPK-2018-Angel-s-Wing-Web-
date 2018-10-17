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

getProducts();

function removeAllChild(doc) {
    while (doc.hasChildNodes()) { doc.removeChild(doc.firstChild); }
}

function getProducts(part) {
    var count = 0;
    var root = document.getElementById("product-items");
    removeAllChild(root);

    firestore.collection("products").orderBy("createdAt", "desc").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const product = doc.data();

            if (part) {
                if (product.seller.part != part) {
                    return;
                }
            }

            var divProductName = document.createElement("div")
            divProductName.classList.add('tf');
            divProductName.classList.add('product-name');
            divProductName.innerText = product.name;

            var divSellerName = document.createElement("div")
            divSellerName.classList.add('tf');
            divSellerName.classList.add('seller-name');
            divSellerName.innerText = product.seller.name;

            var divPart = document.createElement("div")
            divPart.classList.add('tf');
            divPart.classList.add('seller-part');
            divPart.innerText = product.seller.part;

            var divPrice = document.createElement("input")
            divPrice.classList.add('tf');
            divPrice.classList.add('price');
            divPrice.setAttribute("type", "number");
            divPrice.setAttribute("value", product.price);

            var divDonation = document.createElement("input")
            divDonation.classList.add('tf');
            divDonation.classList.add('donation');
            divDonation.setAttribute("type", "number");
            var donation = product.donation;
            if (!donation) {
                donation = parseInt(product.price * 0.4)
                divDonation.setAttribute("placeholder", donation);
            } else {
                divDonation.setAttribute("value", donation);
            }

            var divSoldout = document.createElement("input")
            divSoldout.classList.add('tf');
            divSoldout.classList.add('sold-out');
            divSoldout.setAttribute("type", "submit");
            divSoldout.setAttribute("value", "판매 완료");
            divSoldout.addEventListener('click', function () {
                saveProduct(product.id, divPrice.value, divDonation.value);
            });

            var divProduct = document.createElement("div");
            divProduct.className = "div-product"

            divProduct.appendChild(divProductName);
            divProduct.appendChild(divSellerName);
            divProduct.appendChild(divPart);
            divProduct.appendChild(divPrice);
            divProduct.appendChild(divDonation);
            divProduct.appendChild(divSoldout);

            root.appendChild(divProduct);
            count++;
        });

        console.log(part + ": " + count);
    });
}

function saveProduct(productId, price, donation) {
    if (!donation || donation < 0) {
        alert("기부 금액을 입력해주세요.");
        return;
    }

    firestore.collection("products")
        .doc(productId).set({
            onSale: false,
            price: parseInt(price),
            donation: parseInt(donation)
        }, { merge: true })
        .then(function () {
            console.log("[HPPK] saveProduct - Document successfully written!");
            alert("Success");
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

function onChangedLabTF() {
    var lab = document.getElementById("selectLab").value;
    var selectPart = document.getElementById("selectPart");
    removeAllChild(selectPart);

    if (lab == "전체") {
        var part = document.createElement("option");
        part.value = "전체";
        part.innerText = "전체"
        selectPart.appendChild(part);
    } else if (lab == "1랩") {
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

    onChangedPart();
}

function onChangedPart() {
    const part = document.getElementById('selectPart').value
    getProducts(part)
}