import moment from "moment-timezone";

/**
 * If there are files, there must be exactly two. Otherwise, return an error message
 * @param {number} fileCount derived from the length of the array of files
 * @return {string} error message associated with count. empty if two
 */
export const messageForFileCount = (fileCount) => {
  if ([0, 2].includes(fileCount)) return "";
  if (fileCount < 2)
    return "We need one GPS log file and one DusTrak csv file. Please add a file to continue.";
  if (fileCount > 2)
    return "We need exactly one GPS log file and one DusTrak csv file. Please remove additional files.";
};

/**
 * Return an error message if any of the times are invalid
 * @param {moment} dustrakStart
 * @param {moment} dustrakEnd
 * @param {moment} gpsStart
 */
export const messageForInvalidTime = (dustrakStart, dustrakEnd, gpsStart) =>
  !dustrakStart.isValid() || !dustrakEnd.isValid() || !gpsStart.isValid()
    ? "Files could not be uploaded. Try again or choose a different file."
    : "";

/**
 * Return an error message if the gps start time is not within a four minute window of the dustrak start time
 * @param {moment} dustrakStart
 * @param {moment}  gpsStart
 */
export const messageForMismatchedTimes = (dustrakStart, gpsStart) =>
  !gpsStart.isSame(dustrakStart, "day")
    ? "Dates don't match. Please replace one of your files to continue."
    : !gpsStart.isBetween(
        dustrakStart.clone().subtract(2, "minutes"),
        dustrakStart.clone().add(2, "minutes")
      )
    ? "Times don't match. Please replace one of your files to continue."
    : "";

/**
 * If either gps or dustrak file is undefined, set an error message
 * @param {Array<File | undefined>} files gps and dustrak file
 * @returns {string} possible error message
 */
export const messageForMissingFileType = (files) =>
  files.includes(undefined)
    ? "We need one GPS log file and one DusTrak csv file. Please replace one of your files to continue."
    : "";

/**
 * Takes two "mystery" files, checks for a dustrak and gps file, and places them in a specific order
 * @param {Array<FileWithPath>} files files are unknown at this point
 * @returns {Array<File | undefined>} gps and dustrak files are placed in a specific order, or are undefined
 */
export const identFiles = (files) => {
  let gpsFile;
  let dustrakFile;
  files.forEach((file) => {
    file.name.endsWith(".csv") && (dustrakFile = file);
    file.name.endsWith(".log") && (gpsFile = file);
  });
  return [gpsFile, dustrakFile];
};

/**
 * Serial number for the dustrak file is metadata in a specific place of the file
 * @param {Array<string>} textLines content of the file as a list of each line
 * @returns {string} the serial number as a string, or empty if file not long enough to have a serial number
 */
export const getDustrakSerial = (textLines) => {
  const lineWithSerial = textLines.length > 2 ? textLines[2].split(",") : [""];
  return lineWithSerial.length > 1 ? lineWithSerial[1].trim() : "";
};

/**
 * Find the start datetime of the gps file.
 * Assume it is within the first 10 lines of the gps file.
 * @param {Array<string>} textLines content of the file as a list of each line
 * @returns {moment} start datetime of gps file- valid or invalid
 */
export const getGpsStart = (textLines) => {
  for (const line of textLines) {
    if (line.startsWith("$GPRMC")) {
      const lineFields = line.split(",", 10);
      const startTime = lineFields[1];
      const startDate = lineFields[9];
      return moment.utc(`${startDate} ${startTime}`, "DDMMYYYY hh mm ss.SS");
    }
  }
  return moment.utc("");
};

/**
 * Find the start datetime of the dustrak file
 * @param {Array<string>} textLines content of the file as a list of each line
 * @returns {moment} start datetime of dustrak file- valid or invalid
 */
export const getDustrakStart = (textLines) => {
  if (textLines.length > 7) {
    const startTime = textLines[6].split(",")[1];
    const startDate = textLines[7].split(",")[1];
    return moment.tz(
      `${startDate} ${startTime}`,
      "MM-DD-YYYY hh:mm:ss a",
      "America/Los_Angeles"
    );
  }
  return moment("");
};

/**
 * Find the stop datetime of the Dustrak File
 * @param {Array<string>} textLines content of the file as a list of each line
 * @param {moment} startDatetime start datetime of dustrak file- valid or invalid
 * @returns {moment} the end datetime of dustrak file - valid or invalid
 */
export const getDustrakEnd = (textLines, startDatetime) => {
  if (textLines.length > 8) {
    const [days, hours, minutes] = textLines[8].split(",")[1].split(":");
    return startDatetime
      .clone()
      .add(days, "days")
      .add(hours, "hours")
      .add(minutes, "minutes");
  }
  return moment("");
};

/**
 * Take the meta data about the collection session from the top of the file
 * @param {FileWithPath} file raw file
 * @param {number} endLine last line to extract, above which we expect to already have the necessary content
 * @returns {Array<string>} Text lines of File Content
 */
export const extractFileMetaContent = async (file, endLine = 10) => {
  try {
    const gpsContent = await file.text();
    return gpsContent.split("\n", endLine);
  } catch {
    console.error("error getting data from the file");
    return [""];
  }
};
