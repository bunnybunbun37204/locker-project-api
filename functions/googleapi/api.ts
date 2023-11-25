import { sheets_v4 } from "googleapis";
import { auth, getGoogleSheets } from "./constants";
import { spreadsheetsId } from "../lib/constants";
import { User } from "../mongodbapi/schema";

interface Locker {
  locker_id: string;
  locker_status: string;
}

export const getData = async (
  googleSheets: sheets_v4.Sheets,
  range: string
) => {
  const getRows = await googleSheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: spreadsheetsId,
    range: range,
  });
  const value = getRows.data.values;
  if (!value) {
    return [];
  }
  return value;
};

export const booked = async (
  user_id: string,
  locker_id: string,
  isBooked: string,
  sheet: string,
  googleSheets: sheets_v4.Sheets
) => {
  if (!user_id || !locker_id || !isBooked) {
    return {
      status: 400,
      message: "Plz provide userId, locker_id",
    };
  }

  const updatedValue = [locker_id];
  const data = await getData(googleSheets, sheet);
  const updatedb = data.map((r) =>
    updatedValue.includes(r[0]) ? [r[0], isBooked] : r
  );

  await googleSheets.spreadsheets.values.update({
    auth: auth,
    spreadsheetId: spreadsheetsId,
    range: sheet,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: updatedb,
    },
  });
  const user = await User.findById(user_id);

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  await user.updateOne({
    locker: {
      locker_id: locker_id,
      status: isBooked,
    },
  });
  return {
    status: 200,
    message: "success",
  };
};

export const getDataRows = async (
  googleSheets: sheets_v4.Sheets,
  sheet: string
) => {
  try {
    // Get Row Value Data
    const result = await getData(googleSheets, sheet);
    result.shift();
    let datas: Locker[] = [];
    result?.map((d: string[]) =>
      datas.push({
        locker_id: d[0],
        locker_status: d[1],
      })
    );
    return {
      status: 200,
      message: datas,
    };
  } catch (error) {
    return {
      status: 500,
      message: error,
    };
  }
};
