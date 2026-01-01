// Google Apps Script Code
// Copy and paste this into your Google Apps Script editor

const SPREADSHEET_ID = "1BOJCk0_fovm6gB-05QwFPGvG_I-p7bzIN1NUdmNbyu8";
const SHEET_NAME = "romance-cakes";
const FOLDER_ID = "14TRhyRbClLXNyNY0h-N0sjPJ705Oz5_c";

function doGet(e) {
    return handleRequest(e);
}

function doPost(e) {
    return handleRequest(e);
}

function handleRequest(e) {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    try {
        const action = e.parameter.action;

        if (action === "read") {
            const data = getAllCakes();
            return jsonResponse(data, headers);
        }

        // Handle POST
        if (e.postData) {
            const payload = JSON.parse(e.postData.contents);
            const actionPost = payload.action;

            // Handle Image Upload if present
            if (payload.data && payload.data.imageFile) {
                const imageUrl = saveImageToDrive(payload.data.imageFile, payload.data.imageName);
                payload.data.image_url = imageUrl; // Overwrite URL with new Drive Link

                delete payload.data.imageFile;
                delete payload.data.imageName;
            }

            if (actionPost === "add") {
                const result = addCake(payload.data);
                return jsonResponse(result, headers);
            } else if (actionPost === "edit") {
                const result = editCake(payload.id, payload.data);
                return jsonResponse(result, headers);
            } else if (actionPost === "delete") {
                const result = deleteCake(payload.id);
                return jsonResponse(result, headers);
            }
        }

        return jsonResponse({ status: "error", message: "Invalid action" }, headers);

    } catch (error) {
        return jsonResponse({ status: "error", message: error.toString() }, headers);
    }
}

function jsonResponse(data, headers) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

// --- Drive Operations ---

function saveImageToDrive(base64Data, fileName) {
    try {
        const folder = DriveApp.getFolderById(FOLDER_ID);
        // data:image/jpeg;base64,.....
        const split = base64Data.split(',');
        const type = split[0].split(';')[0].replace('data:', '');
        const data = Utilities.base64Decode(split[1]);
        const blob = Utilities.newBlob(data, type, fileName);

        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        // User requested format
        return "https://lh3.googleusercontent.com/d/" + file.getId();
    } catch (e) {
        throw new Error("Image Upload Failed: " + e.message);
    }
}

// --- Data Operations ---

function getSheet() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return ss.getSheetByName(SHEET_NAME);
}

function getAllCakes() {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return []; // Only headers

    // Map columns based on user's sheet: 
    // id, cakename, flavor/weight, price, Category, image_url, description

    const rows = data.slice(1);
    return rows.map(row => {
        return {
            id: row[0],
            title: row[1],        // cakename
            author: row[2],       // flavor/weight (using 'author' key to keep frontend compat for now or refactor)
            price: row[3],
            category: row[4],
            image_url: row[5],
            description: row[6]
        };
    });
}

function addCake(cakeData) {
    const sheet = getSheet();
    // Sheet Order: id, cakename, flavor/weight, price, Category, image_url, description
    const newRow = [
        cakeData.id,
        cakeData.title,
        cakeData.author,
        cakeData.price,
        cakeData.category,
        cakeData.image_url,
        cakeData.description
    ];
    sheet.appendRow(newRow);
    return { status: "success", message: "Cake added successfully" };
}

function editCake(id, cakeData) {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
            // Update columns A(1) to G(7)
            const range = sheet.getRange(i + 1, 1, 1, 7);
            range.setValues([[
                id,
                cakeData.title,
                cakeData.author,
                cakeData.price,
                cakeData.category,
                cakeData.image_url,
                cakeData.description
            ]]);
            return { status: "success", message: "Cake updated" };
        }
    }
    return { status: "error", message: "Cake not found" };
}

function deleteCake(id) {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
            sheet.deleteRow(i + 1);
            return { status: "success", message: "Cake deleted" };
        }
    }
    return { status: "error", message: "Cake not found" };
}

function authorizeScript() {
    try {
        console.log("1. Checking Spreadsheet access...");
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        console.log("   - Success! Spreadsheet Name: " + ss.getName());

        console.log("2. Checking Drive Folder access...");
        const folder = DriveApp.getFolderById(FOLDER_ID);
        console.log("   - Success! Folder Name: " + folder.getName());

        console.log("3. Checking Write Permissions...");
        const temp = folder.createFile("auth_check_temp.txt", "Just checking permissions.");
        temp.setTrashed(true);
        console.log("   - Success! Write permissions confirmed.");

        console.log("-----------------------------------------");
        console.log("READY TO DEPLOY!");
        console.log("Permissions are all good.");
    } catch (e) {
        console.error("AUTHORIZATION FAILED:");
        console.error(e.message);
        console.log("-----------------------------------------");
        console.log("Troubleshooting Tips:");
        console.log("1. Check if SPREADSHEET_ID and FOLDER_ID are correct.");
        console.log("2. Ensure your Google Account has 'Editor' access to both.");
    }
}

function deleteBook(id) {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
            sheet.deleteRow(i + 1);
            return { status: "success", message: "Book deleted" };
        }
    }
    return { status: "error", message: "Book not found" };
}

// FORCE PERMOTION REQUEST:
function authorizeScript() {
    console.log("Checking permissions...");
    // This line is CRITICAL. It forces Google to ask for "Edit/Create" permissions.
    // We create a tiny temp file and then delete it immediately.
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const temp = folder.createFile("auth_check.txt", "checking permissions");
    temp.setTrashed(true);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log("SUCCESS! Permissions upgraded to Read/Write. You can now deploy.");
}