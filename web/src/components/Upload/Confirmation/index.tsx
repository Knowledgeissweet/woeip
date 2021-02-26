import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import {
  Message,
  Icon,
  Button,
  Container,
  Input,
  Modal
} from 'semantic-ui-react'
import {
  identFiles,
  getDustrakStart,
  getDustrakEnd,
  getDustrakSerial
} from 'components/Upload/util'
import { ConfirmationProps } from 'components/Upload/Confirmation/types'
import axios from 'axios'
import styled from 'theme'
import moment from 'moment-timezone'

const StyledContainer = styled(Container)`
  margin-top: 30px;
`

const ContentContainer = styled.div`
  margin: 0px 130px 0px 130px;
`

const SuccessBanner = styled(Message)`
  background: #619e54 !important;
  height: 48px;
  width: 100%;
  display: flex;
  border-radius: 4px;
  align-items: center;
  margin-bottom: 32px;
  * {
    color: ${({ theme }) => theme.colors.white};
  }
  i.icon {
    font-size: 20px;
  }
  h3 {
    font-size: 24px;
  }
`

const SuccessIcon = () => <Icon name='check circle outline' />

const SuccessMessage = styled.span`
  font-family: ${({ theme }) => theme.fonts.secondary};
  font-size: 1rem;
`

const FormMessage = styled.h3`
  font-size: 1.5rem;
`

const FormContainer = styled.div`
  width: 500px;
  margin: 0 auto;
`

const FormContent = styled.div`
  padding: 1.85rem 4.5rem 5rem 2rem;
`
const DisabledInput = styled(Input)`
  min-width: auto;
  width: 160px;
`

const InputLabel = styled.p`
  font-family: ${({ theme }) => theme.fonts.primary};
  font-size .875rem;
  line-height: 24px;
  margin: 0px 0px 32px 0px !important;
`
const SubmitForm = styled.form`
  display: flex;
  justify-content: space-between;
  margin-top: 48px;
`
const FormButton = styled(Button)`
  border-radius: 2px !important;
  font-family: ${({ theme }) => theme.fonts.secondary} !important;
  font-style: normal !important;
  font-weight: 500 !important;
  width: 160px !important;
  font-size: 1rem !important;
`
const SaveButton = styled(FormButton)`
  color: ${({ theme }) => theme.colors.white} !important;
  background-color: rgba(53, 53, 53, 0.9) !important;
`
const CancelButton = styled(FormButton)`
  color: rgba(53, 53, 53, 0.9) !important;
  background-color: #f4f5f4 !important;
`
const StyledModal = styled(Modal)`
  padding: 1.5rem;
  padding-top: 7rem;
  max-width: 500px;
  .header {
    border: none !important;
  }
  .content {
    margin-bottom: 4rem;
  }
  .actions {
    border: none !important;
    background: ${({ theme }) => theme.colors.white} !important;
  }
  i.close {
    top: 1.0535rem !important;
    right: 1rem !important;
    color: rgba(53, 53, 53, 0.9) !important;
  }
`
const BackButton = styled(FormButton)`
  color: rgba(53, 53, 53, 0.9) !important;
  background-color: #fff !important;
  border: 1px solid rgba(53, 53, 53, 0.9) !important;
`

const devices = {
  '8530091203': 'Device A',
  '8530094612': 'Device B',
  '8530100707': 'Device C'
}

const Confirmation = ({
  files,
  setFiles,
  setProceed
}: ConfirmationProps): JSX.Element => {
  const [dustrakText, setDustrakText] = useState<Array<string>>([])
  const [dustrakStart, setDustrakStart] = useState<moment.Moment>(moment(''))
  const [dustrakSerial, setDustrakSerial] = useState<string>('')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const history = useHistory()

  useEffect(() => {
    ;(async () => {
      const dustrakFile: File = identFiles(files)[1] as File
      const dustrakString: string = await dustrakFile.text()
      const dustrakTextUpdate: Array<string> = dustrakString.split('\n', 10)
      setDustrakText(dustrakTextUpdate)
      const dustrakStartUpdate: moment.Moment = getDustrakStart(
        dustrakTextUpdate
      )
      setDustrakStart(dustrakStartUpdate)
      const dustrakSerialUpdate: string = getDustrakSerial(dustrakTextUpdate)
      setDustrakSerial(dustrakSerialUpdate)
    })()
  }, [files])
  const upload = (e: React.FormEvent) => {
    setIsSaving(true)
    e.preventDefault()
    const formData = new FormData()

    formData.append('upload_files', files[0])
    formData.append('upload_files', files[1])
    formData.append('starts_at', dustrakStart.format())
    formData.append(
      'ends_at',
      getDustrakEnd(dustrakText, dustrakStart).format()
    )
    formData.append('pollutant', '1')

    axios
      .post('http://api.lvh.me/collection', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(d => {
        console.log('response data is:', d)
        history.push({
          pathname: '/maps',
          state: {
            date: dustrakStart.format('MM/DD/YYYY')
          }
        })
      })
      .catch(error => {
        console.error(error)
        alert(`files failed to upload: ${error.message}`)
      })

      return () => setIsSaving(false)
  }

  const cancelUpload = () => {
    setFiles([])
    setProceed(false)
  }

  return (
    <StyledContainer>
      <ContentContainer>
        <SuccessBanner>
          <SuccessIcon />
          <SuccessMessage>Success! Your files were uploaded.</SuccessMessage>
        </SuccessBanner>
        <FormMessage>Step 2. Confirm your session details</FormMessage>
        <FormContainer>
          <FormContent>
            <div>
              <DisabledInput
                value={dustrakStart.format('MM/DD/YYYY')}
                icon='calendar outline'
                disabled={true}
              />
            </div>
            <InputLabel>Collection date</InputLabel>
            <DisabledInput
              value={dustrakStart.format('h:mm A')}
              disabled={true}
            />
            <InputLabel>Start time</InputLabel>
            <DisabledInput value={devices[dustrakSerial]} disabled={true} />
            <InputLabel>Device</InputLabel>
            <SubmitForm onSubmit={upload}>
              <SaveButton type='submit' loading={isSaving}>Save</SaveButton>
              { !isSaving && <CancelButton type='button' onClick={() => setShowModal(true)}>
                Cancel
              </CancelButton>}
            </SubmitForm>
          </FormContent>
        </FormContainer>
        <StyledModal
          closeIcon
          open={showModal}
          onClose={() => setShowModal(false)}
        >
          <Modal.Header>Cancel data upload?</Modal.Header>
          <Modal.Content>Cancelling now will delete your data.</Modal.Content>
          <Modal.Actions>
            <BackButton onClick={() => setShowModal(false)}>Go back</BackButton>
            <SaveButton onClick={cancelUpload}>Cancel upload</SaveButton>
          </Modal.Actions>
        </StyledModal>
      </ContentContainer>
    </StyledContainer>
  )
}

export default Confirmation
