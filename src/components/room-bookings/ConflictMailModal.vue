<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content modal-large">
      <div class="modal-header">
        <h3>📧 E-Mail an Konflikt-Beteiligte</h3>
        <button type="button" @click="closeModal" class="close-btn">×</button>
      </div>

      <div class="modal-body">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <p>Empfänger werden geladen...</p>
        </div>

        <div v-else>
          <!-- Recipients -->
          <div class="section">
            <h4>Empfänger (sortiert nach Priorität)</h4>
            <div class="recipient-list">
              <label
                v-for="recipient in localRecipients"
                :key="recipient.personId"
                class="recipient-item"
                :class="{ disabled: !recipient.email }"
              >
                <input
                  type="checkbox"
                  v-model="recipient.selected"
                  :disabled="!recipient.email"
                />
                <span class="recipient-priority">
                  {{ priorityBadge(recipient.party.priorityRank) }}
                </span>
                <span class="recipient-name">{{ recipient.name }}</span>
                <span class="recipient-role">{{ roleLabel(recipient.role) }}</span>
                <span class="recipient-email" v-if="recipient.email">
                  {{ recipient.email }}
                </span>
                <span class="recipient-email missing" v-else>
                  (keine E-Mail)
                </span>
              </label>
            </div>
            <p class="priority-info">
              ⓘ Priorität nach „first come, first served" – ältere / bereits
              genehmigte Buchungen haben Vorrang.
            </p>
          </div>

          <!-- Template -->
          <div class="section">
            <label for="templateSelect" class="form-label">Vorlage:</label>
            <select
              id="templateSelect"
              v-model="selectedTemplateId"
              class="ct-select"
              @change="applyTemplate"
            >
              <option
                v-for="template in templates"
                :key="template.id"
                :value="template.id"
              >
                {{ template.label }}
              </option>
            </select>
          </div>

          <!-- Subject -->
          <div class="section">
            <label for="subjectInput" class="form-label">Betreff:</label>
            <input
              id="subjectInput"
              v-model="draft.subject"
              type="text"
              class="ct-input"
              placeholder="Betreff eingeben..."
            />
          </div>

          <!-- Message -->
          <div class="section">
            <label for="messageTextarea" class="form-label">Nachricht:</label>
            <textarea
              id="messageTextarea"
              v-model="draft.bodyHtml"
              class="ct-textarea"
              rows="10"
              placeholder="Nachricht eingeben..."
            ></textarea>
          </div>

          <!-- BCC -->
          <div class="section bcc-section">
            <label class="checkbox-label">
              <input type="checkbox" v-model="draft.bccSelf" />
              Mich (Admin) in BCC setzen
            </label>
          </div>

          <!-- Error Banner -->
          <div v-if="errorMessage" class="error-banner">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          type="button"
          @click="closeModal"
          class="ct-btn ct-btn-outline"
          :disabled="isSending"
        >
          Abbrechen
        </button>
        <button
          type="button"
          @click="sendMail"
          class="ct-btn ct-btn-primary"
          :disabled="!canSend || isSending"
        >
          <span v-if="isSending">⏳ Senden...</span>
          <span v-else>📨 E-Mail senden</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { RoomBooking, ConflictMailRecipient, ConflictPartyEntry } from './useRoomBookings'
import {
  CONFLICT_MAIL_TEMPLATES,
  getTemplateById,
  type ConflictMailTemplateId,
} from './conflictMailTemplates'

interface Props {
  isOpen: boolean
  booking: RoomBooking | null
  recipients?: ConflictMailRecipient[]
  parties?: ConflictPartyEntry[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  booking: null,
  recipients: () => [],
  parties: () => [],
  isLoading: false,
})

const emit = defineEmits<{
  close: []
  send: [
    draft: {
      recipients: ConflictMailRecipient[]
      subject: string
      bodyHtml: string
      bccSelf: boolean
    }
  ]
}>()

const templates = CONFLICT_MAIL_TEMPLATES
const selectedTemplateId = ref<ConflictMailTemplateId>('clarify-priority')
const isSending = ref(false)
const errorMessage = ref('')

const localRecipients = ref<ConflictMailRecipient[]>([])
const localParties = ref<ConflictParty[]>([])

const draft = ref({
  subject: '',
  bodyHtml: '',
  bccSelf: false,
})

const canSend = computed(() => {
  const hasRecipients = localRecipients.value.some((r) => r.selected && r.email)
  const hasSubject = draft.value.subject.trim().length > 0
  return hasRecipients && hasSubject
})

const closeModal = () => {
  emit('close')
}

const priorityBadge = (rank: number): string => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

const roleLabel = (role: string): string => {
  switch (role) {
    case 'requester':
      return '(Anfrage)'
    case 'conflictCreator':
      return '(Bestand)'
    case 'onBehalfOf':
      return '(i.A.)'
    default:
      return ''
  }
}

const applyTemplate = () => {
  if (!props.booking) return
  const template = getTemplateById(selectedTemplateId.value)
  draft.value.subject = template.buildSubject(props.booking)
  draft.value.bodyHtml = template.buildBody(
    props.booking,
    localRecipients.value,
    localParties.value
  )
}

const sendMail = () => {
  if (!canSend.value) return
  errorMessage.value = ''
  isSending.value = true
  emit('send', {
    recipients: localRecipients.value,
    subject: draft.value.subject,
    bodyHtml: draft.value.bodyHtml,
    bccSelf: draft.value.bccSelf,
  })
}

// Sync external recipients/parties into local state
watch(
  () => ({ isOpen: props.isOpen, rLen: props.recipients.length, pLen: props.parties.length }),
  ({ isOpen, rLen, pLen }) => {
    if (isOpen && rLen > 0 && pLen > 0) {
      localRecipients.value = props.recipients.map((r) => ({ ...r, selected: r.selected }))
      localParties.value = props.parties
      applyTemplate()
    }
  }
)

// Reset state on close
watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      localRecipients.value = []
      localParties.value = []
      draft.value = { subject: '', bodyHtml: '', bccSelf: false }
      selectedTemplateId.value = 'clarify-priority'
      errorMessage.value = ''
      isSending.value = false
    }
  }
)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1003;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.modal-large {
  max-width: 750px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.section {
  margin-bottom: 20px;
}

.section h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.loading-state {
  text-align: center;
  padding: 40px 0;
  color: #666;
}

.recipient-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px;
}

.recipient-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.recipient-item:hover {
  background: #f5f5f5;
}

.recipient-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recipient-item input[type='checkbox'] {
  cursor: pointer;
}

.recipient-item input[type='checkbox']:disabled {
  cursor: not-allowed;
}

.recipient-priority {
  font-size: 1.1rem;
  min-width: 24px;
  text-align: center;
}

.recipient-name {
  font-weight: 500;
  flex: 1;
}

.recipient-role {
  color: #666;
  font-size: 0.85rem;
}

.recipient-email {
  color: #888;
  font-size: 0.85rem;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipient-email.missing {
  color: #999;
  font-style: italic;
}

.priority-info {
  margin: 8px 0 0 0;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

.ct-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

.ct-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

.ct-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.bcc-section {
  margin-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

.error-banner {
  padding: 12px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  margin-top: 12px;
}

.ct-btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s;
}

.ct-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ct-btn-outline {
  background: white;
  color: #333;
}

.ct-btn-outline:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #999;
}

.ct-btn-primary {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.ct-btn-primary:hover:not(:disabled) {
  background: #1976d2;
  border-color: #1976d2;
}

@media (max-width: 600px) {
  .modal-content {
    max-width: 95vw;
    max-height: 95vh;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-footer {
    padding: 12px 16px;
  }

  .recipient-item {
    flex-wrap: wrap;
  }

  .recipient-email {
    max-width: none;
    width: 100%;
  }
}
</style>
