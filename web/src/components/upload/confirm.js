import { PropTypes } from "prop-types";
import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";

import { getFilesForm } from "./confirm.utils";

import {
  Segment,
  SuccessMessage,
  CalendarInput,
  Input,
  PositiveActionButton,
  NeutralActionButton,
  Container,
  List,
} from "../ui";

import { UploadCancelModal } from "./cancelModal";
import { Form } from "semantic-ui-react";
import { apiUrlCollections } from "../../api.util";

/**
 * Allow the user to view data about their files
 * The may choose whether to proceed with saving their files on the server
 * @property {Object} dustrakSerialToLabel Map of each dustrak serial number to its label
 * @property {Array<FileWithPath} files GPS and Dustrak Pair, validated during drop phase
 * @property {Moment} dustrakStart Reference point to when the data collection session started
 * @property {Moment} dustrakEnd Reference point to when the data collection session ended
 * @property {Moment} dustrakSerial Reference point to what device was used to collect session data
 * @property {function} clearFiles Overloads setFiles with empty array
 * @property {function} clearDustrakTimes Overloads setDustrakStart and setDustrakEnd with invalid moments
 * @property {function} clearDustrakSerial Overloads setDustrakSerial with empty string
 * @property {function} returnToDrop Overloads setPhase with "drop"
 * @modifies {database} Confirmation of files will send them to the server to be saved
 */
export const UploadConfirm = ({
  dustrakSerialToLabel,
  files,
  dustrakStart,
  dustrakEnd,
  dustrakSerial,
  clearFiles,
  clearDustrakTimes,
  clearDustrakSerial,
  returnToDrop,
}) => {
  const [shouldShowCancelModal, setShouldShowCancelModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filesForm, setFilesForm] = useState(new Form());
  const [cancelTokenSource, setCancelTokenSource] = useState(null); //Initialized when staging to save

  /**
   * convert useHistory to usable form
   */
  const history = useHistory();

  /**
   * Use the dependency array to watch for signs that we are staging to save
   * After staging to save, send a post to the collections api endpoint
   * @modifies {api} collections endpoint with session files and metadata
   * @modifies {history} move from upload to map view after upload complete
   * @modifies {window} generates an alert if request fails
   * @modifies {isSaving} sets to false if upload fails
   */
  useEffect(() => {
    (async () => {
      if (isSaving) {
        const options = {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          cancelToken: cancelTokenSource.token,
        };
        try {
          await axios.post(apiUrlCollections(), filesForm, options);
          history.push({
            pathname: "/maps",
            state: {
              date: dustrakStart.format("MM/DD/YYYY"),
            },
          });
        } catch (thrown) {
          if (axios.isCancel(thrown)) {
            alert("Canceled request to save uploads");
          } else {
            alert("Failed to save uploads");
          }
        }
        setIsSaving(false);
      }
    })();
  }, [filesForm, dustrakStart, history, cancelTokenSource, isSaving]);

  /**
   * @modifies {isSaving} Notify component we are saving
   * @modifies {filesForm} Generate file form data
   * @modifies {cancelTokenSource} Generate new cancel token
   */
  const stageSaveUpload = () => {
    setIsSaving(true);
    setFilesForm(
      getFilesForm({
        firstFile: files[0],
        secondFile: files[1],
        dustrakStart,
        dustrakEnd,
      })
    );
    setCancelTokenSource(axios.CancelToken.source());
  };

  /**
   * When canceling an upload
   * @modifies {api request} 1) If in the process of saving, cancel
   * @modifies {dustrakStart && dustrakEnd && files} 2) clear the files and their data
   * @modifies {phase} 3) Return to the drop page
   */
  const cancelUpload = () => {
    isSaving && cancelTokenSource.cancel();
    clearDustrakTimes();
    clearDustrakSerial();
    clearFiles();
    returnToDrop();
  };

  return (
    <Container>
      <SuccessMessage>Success! Your files match.</SuccessMessage>
      <Container textAlign="center">
        <h2>Step 2. Confirm your session details</h2>
        <List>
          <List.Item>
            <CalendarInput value={dustrakStart.format("MM/DD/YYYY")} disabled />
          </List.Item>
          <List.Item>Collection date</List.Item>
          <List.Item>
            <Input disabled value={dustrakStart.format("h:mm A")} />
          </List.Item>
          <List.Item>Start Time</List.Item>
          <List.Item>
            <Input disabled value={dustrakSerialToLabel[dustrakSerial]}></Input>
          </List.Item>
          <List.Item>Device</List.Item>
        </List>

        <Segment.Inline>
          <PositiveActionButton
            onClick={stageSaveUpload}
            loading={isSaving}
            disabled={isSaving}
          >
            Save
          </PositiveActionButton>
          <NeutralActionButton onClick={() => setShouldShowCancelModal(true)}>
            Cancel
          </NeutralActionButton>
        </Segment.Inline>
      </Container>

      <UploadCancelModal
        shouldShowCancelModal={shouldShowCancelModal}
        closeCancelModal={() => setShouldShowCancelModal(false)}
        cancelUpload={cancelUpload}
      />
    </Container>
  );
};

UploadConfirm.propTypes = {
  dustrakSerialToLabel: PropTypes.object,
  files: PropTypes.array,
  dustrakStart: PropTypes.object,
  dustrakEnd: PropTypes.object,
  dustrakSerial: PropTypes.string,
  clearDustrakTimes: PropTypes.func.isRequired,
  clearDustrakSerial: PropTypes.func.isRequired,
  clearFiles: PropTypes.func.isRequired,
  returnToDrop: PropTypes.func.isRequired,
};