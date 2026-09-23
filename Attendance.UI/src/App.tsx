import { useEffect, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QRCodeSVG } from 'qrcode.react'
import './App.css'

type Student = {
  studentId: number
  sectionId: number
  schoolStudentNumber: string
  trackingCode: string
  firstName: string
  middleName?: string | null
  lastName: string
  email?: string | null
  phoneNumber?: string | null
}

type Guardian = {
  guardianId: number
  firstName: string
  middleName?: string | null
  lastName: string
  email?: string | null
  contactNumber: string
  relationshipType?: string | null
}

type Section = {
  sectionId: number
  sectionName: string
  isActive: boolean
}

type GuardianAttendance = {
  attendanceId: number
  checkInTime: string | null
  checkOutTime: string | null
  status: string
}

type GuardianEvent = {
  eventId: number
  title: string
  content: string
  eventDate: string | null
}

type GuardianLookup = {
  studentId: number
  firstName: string
  lastName: string
  sectionName: string
  trackingCode: string
  attendanceDate: string
  attendanceRecords: GuardianAttendance[]
  events: GuardianEvent[]
  guardian: GuardianSummary | null
}

type GuardianSummary = {
  firstName: string
  middleName?: string | null
  lastName: string
  relationshipType?: string | null
  contactNumber?: string | null
  email?: string | null
}

type DailyAttendance = {
  attendanceId: number
  studentId: number
  studentName: string
  sectionId: number
  checkInAt: string | null
  checkOutAt: string | null
  status: string
}

type NotificationEvent = {
  eventId: number
  sectionId: number | null
  title: string
  content: string
  eventDate: string | null
}

type AttendanceScannerProps = {
  attendanceApiBase: string
  token: string
  selectedSectionId: string
  sectionReady: boolean
}

function AttendanceScanner({ attendanceApiBase, token, selectedSectionId, sectionReady }: AttendanceScannerProps) {
  const [activeView, setActiveView] = useState<'scan' | 'register'>('scan')
  const [scannedCode, setScannedCode] = useState('')
  const [scanMessage, setScanMessage] = useState('Point the camera at a student QR code.')
  const [lastAction, setLastAction] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dailyRecords, setDailyRecords] = useState<DailyAttendance[]>([])
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (activeView !== 'register' || !sectionReady || !selectedSectionId) return

    setRegisterLoading(true)
    setRegisterError('')
    const query = new URLSearchParams({ date: selectedDate })
    if (selectedSectionId) query.set('sectionId', selectedSectionId)
    fetch(`${attendanceApiBase}/attendance/day?${query.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text() || 'Unable to load attendance.')
        return response.json() as Promise<DailyAttendance[]>
      })
      .then(setDailyRecords)
      .catch((error: unknown) => setRegisterError(error instanceof Error ? error.message : 'Unable to load attendance.'))
      .finally(() => setRegisterLoading(false))
  }, [activeView, selectedDate, selectedSectionId, sectionReady, attendanceApiBase, token])

  useEffect(() => {
    if (scannedCode) return

    const scanner = new Html5Qrcode('attendance-qr-reader')
    const scannerConfig = { fps: 10, qrbox: { width: 240, height: 240 } }
    let disposed = false
    let scannerRunning = false

    void scanner.start(
      { facingMode: 'environment' },
      scannerConfig,
      (decodedText) => {
        if (disposed) return
        setScannedCode(decodedText.trim())
        setScanMessage('Student QR code detected. Choose an attendance action.')
        if (scannerRunning) {
          scannerRunning = false
          void scanner.stop().catch(() => undefined)
        }
      },
      () => undefined,
    ).then(() => {
      if (disposed) {
        void scanner.stop().catch(() => undefined)
        return
      }
      scannerRunning = true
    }).catch(() => {
      if (!disposed) setScanMessage('Camera unavailable on this device. Use the desktop tracking-code fallback below.')
    })

    return () => {
      disposed = true
      if (scannerRunning) {
        scannerRunning = false
        void scanner.stop().catch(() => undefined)
      }
    }
  }, [scannedCode])

  const completeAction = async (action: 'Clock In' | 'Clock Out') => {
    setActionError('')
    setActionLoading(true)
    try {
      const response = await fetch(`${attendanceApiBase}/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qrToken: scannedCode, action, latitude: null, longitude: null, accuracyMeters: null }),
      })
      if (!response.ok) throw new Error(await response.text() || 'Unable to save attendance.')
      const result = await response.json() as { trackingCode: string; action: string; checkInAt: string | null; checkOutAt: string | null }
      setLastAction(`${result.action} saved for ${result.trackingCode}.`)
      setScannedCode('')
      setScanMessage('Ready for the next student QR code.')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save attendance.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <section className="workspace-panel card scan-panel">
      <div className="page-heading"><div><p className="eyebrow">Daily operations</p><h2>Student Attendance</h2></div><span className="badge">{activeView === 'scan' ? 'Camera ready' : 'Attendance register'}</span></div>
      <div className="tabs attendance-tabs" role="tablist" aria-label="Attendance views"><button type="button" className={activeView === 'scan' ? 'tab active' : 'tab'} onClick={() => setActiveView('scan')}>Scan Student</button><button type="button" className={activeView === 'register' ? 'tab active' : 'tab'} onClick={() => setActiveView('register')}>Daily Register</button></div>
      {activeView === 'scan' && (!scannedCode ? <>
        <div id="attendance-qr-reader" className="qr-reader" />
        <p className="scan-message">{scanMessage}</p>
        <div className="manual-scan"><label htmlFor="manual-qr-code">Tracking code fallback for desktop testing</label><div className="lookup-row"><input id="manual-qr-code" placeholder="Enter the scanned tracking code" onKeyDown={(event) => { if (event.key === 'Enter') setScannedCode(event.currentTarget.value.trim().toUpperCase()) }} /><button type="button" onClick={() => { const input = document.getElementById('manual-qr-code') as HTMLInputElement; setScannedCode(input.value.trim().toUpperCase()) }}>Continue</button></div><small>On a phone, the camera reads this value from the QR code automatically.</small></div>
      </> : <div className="scan-result"><span className="label">Scanned value</span><strong>{scannedCode}</strong><p>Select what to record for this student.</p>{actionError && <p className="login-error" role="alert">{actionError}</p>}<div className="scan-actions"><button type="button" className="primary-btn" disabled={actionLoading} onClick={() => void completeAction('Clock In')}>Clock In</button><button type="button" className="secondary-btn" disabled={actionLoading} onClick={() => void completeAction('Clock Out')}>Clock Out</button></div><button type="button" className="text-btn" disabled={actionLoading} onClick={() => setScannedCode('')}>Scan a different student</button></div>)}
      {activeView === 'register' && <div className="register-view"><div className="register-toolbar"><label htmlFor="attendance-date">Attendance date</label><input id="attendance-date" type="date" value={selectedDate} max={today} onChange={(event) => setSelectedDate(event.target.value)} /><span className="form-note">{selectedDate === today ? 'Current date' : 'Read-only historical record'}</span></div>{registerError && <p className="login-error" role="alert">{registerError}</p>}{!sectionReady ? <div className="empty-state compact"><strong>Preparing active section...</strong></div> : registerLoading ? <div className="empty-state compact"><strong>Loading attendance...</strong></div> : <div className="table-wrap"><table><thead><tr><th>Student</th><th>Section</th><th>Clock In</th><th>Clock Out</th><th>Status</th></tr></thead><tbody>{dailyRecords.length === 0 ? <tr><td colSpan={5}>No attendance recorded for this date.</td></tr> : dailyRecords.map((record) => <tr key={record.attendanceId}><td>{record.studentName}</td><td>{record.sectionId}</td><td>{record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td>{record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td><span className="status present">{record.status}</span></td></tr>)}</tbody></table></div>}</div>}
      {activeView === 'scan' && lastAction && <p className="scan-success" role="status">{lastAction}</p>}
    </section>
  )
}

const attendanceRows: Array<{ date: string; checkIn: string; checkOut: string; status: string }> = []
const eventRows: Array<{ date: string; title: string; details: string }> = []

function GuardianPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'events'>('attendance')
  const [trackingCode, setTrackingCode] = useState('')
  const [lookup, setLookup] = useState<GuardianLookup | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const attendanceApiBase = import.meta.env.VITE_ATTENDANCE_API_URL || 'https://localhost:7244/api'
  const tenant = new URLSearchParams(window.location.search).get('tenant') || import.meta.env.VITE_GUARDIAN_TENANT || 'School02'

  const findStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLookup(null)
    setLoading(true)

    try {
      const query = new URLSearchParams({ trackingCode: trackingCode.trim(), tenant })
      const response = await fetch(`${attendanceApiBase}/guardians/today?${query.toString()}`)
      if (!response.ok) throw new Error(await response.text() || 'Student could not be found.')
      setLookup(await response.json())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to find student.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="guardian-page">
      <header className="guardian-header">
        <p className="eyebrow">Attendance Portal</p>
        <h1>Student Attendance</h1>
        <p>Enter the student tracking code to view attendance and school updates.</p>
      </header>
      <section className="guardian-card card">
        <div className="lookup-header"><h2>Guardian Access</h2><span className="badge">Public lookup</span></div>
        <form onSubmit={findStudent}>
          <label className="field-label" htmlFor="guardian-tracking-code">Student tracking code</label>
          <div className="lookup-row"><input id="guardian-tracking-code" required value={trackingCode} onChange={(event) => setTrackingCode(event.target.value.toUpperCase())} placeholder="Enter tracking code" /><button type="submit" disabled={loading}>{loading ? 'Finding...' : 'View'}</button></div>
        </form>
        {error && <p className="login-error" role="alert">{error}</p>}
        {lookup && <><div className="student-summary"><div><span className="label">Student</span><strong>{lookup.firstName} {lookup.lastName}</strong></div><div><span className="label">Section</span><strong>{lookup.sectionName}</strong></div><div><span className="label">Date</span><strong>{new Date(lookup.attendanceDate).toLocaleDateString()}</strong></div></div><div className="guardian-summary"><div><span className="label">Guardian</span><strong>{lookup.guardian ? [lookup.guardian.firstName, lookup.guardian.middleName, lookup.guardian.lastName].filter(Boolean).join(' ') : 'No guardian registered'}</strong></div><div><span className="label">Relationship</span><strong>{lookup.guardian?.relationshipType || '-'}</strong></div><div><span className="label">Emergency contact</span><strong>{lookup.guardian?.contactNumber || '-'}</strong></div><div><span className="label">Email</span><strong>{lookup.guardian?.email || '-'}</strong></div></div>
        <div className="tabs" role="tablist" aria-label="Student information"><button type="button" className={activeTab === 'attendance' ? 'tab active' : 'tab'} onClick={() => setActiveTab('attendance')}>Attendance</button><button type="button" className={activeTab === 'events' ? 'tab active' : 'tab'} onClick={() => setActiveTab('events')}>Events & Notifications</button></div>
        {activeTab === 'attendance' ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Status</th></tr></thead><tbody>{lookup.attendanceRecords.length === 0 ? <tr><td colSpan={4}>No attendance recorded today.</td></tr> : lookup.attendanceRecords.map((row) => <tr key={row.attendanceId}><td>{lookup.attendanceDate}</td><td>{row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td><span className={row.status === 'Present' ? 'status present' : 'status late'}>{row.status}</span></td></tr>)}</tbody></table></div> : <div className="table-wrap"><table><thead><tr><th>Date</th><th>Title</th><th>Details</th></tr></thead><tbody>{lookup.events.length === 0 ? <tr><td colSpan={3}>No events or notifications.</td></tr> : lookup.events.map((row) => <tr key={row.eventId}><td>{row.eventDate ? new Date(row.eventDate).toLocaleDateString() : '-'}</td><td>{row.title}</td><td>{row.content}</td></tr>)}</tbody></table></div>}</>}
      </section>
    </main>
  )
}

function App() {
  const apiBase = import.meta.env.VITE_INVENTORY_API_URL || 'https://localhost:7144/api'
  const attendanceApiBase = import.meta.env.VITE_ATTENDANCE_API_URL || 'https://localhost:7244/api'
  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem('attendance-session')
    if (!savedSession) return null

    try {
      const parsedSession = JSON.parse(savedSession)
      return parsedSession?.token ? parsedSession : null
    } catch {
      localStorage.removeItem('attendance-session')
      return null
    }
  })
  const [loginForm, setLoginForm] = useState({ account: '', username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [activeTab, setActiveTab] = useState<'attendance' | 'events'>('attendance')
  const [students, setStudents] = useState<Student[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState(() => localStorage.getItem('attendance-section-id') || '')
  const [sectionReady, setSectionReady] = useState(false)
  const [studentLoading, setStudentLoading] = useState(false)
  const [studentError, setStudentError] = useState('')
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null)
  const [qrStudent, setQrStudent] = useState<Student | null>(null)
  const [guardianStudent, setGuardianStudent] = useState<Student | null>(null)
  const [guardianForm, setGuardianForm] = useState({ firstName: '', middleName: '', lastName: '', email: '', contactNumber: '', relationshipType: '' })
  const [guardianError, setGuardianError] = useState('')
  const [guardianLoading, setGuardianLoading] = useState(false)
  const [studentForm, setStudentForm] = useState({ firstName: '', middleName: '', lastName: '', email: '', phoneNumber: '', sectionId: '' })
  const [sectionLoading, setSectionLoading] = useState(false)
  const [sectionError, setSectionError] = useState('')
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [sectionName, setSectionName] = useState('')
  const [sectionIsActive, setSectionIsActive] = useState(true)
  const [events, setEvents] = useState<NotificationEvent[]>([])
  const [eventLoading, setEventLoading] = useState(false)
  const [eventError, setEventError] = useState('')
  const [eventForm, setEventForm] = useState({ title: '', content: '' })

  const menuItems = ['Dashboard', 'Students', 'Attendance', 'Events', 'Sections', 'Guardian View']

  if (window.location.pathname === '/guardian') return <GuardianPage />

  const attendanceRequest = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${attendanceApiBase}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `Request failed with status ${response.status}.`)
    }

    return response.status === 204 ? null : response.json()
  }

  const loadStudents = async () => {
    setStudentLoading(true)
    setStudentError('')
    try {
      const [studentResult, sectionResult] = await Promise.all([
        attendanceRequest('/students'),
        attendanceRequest('/sections'),
      ])
      setStudents(studentResult)
      setSections(sectionResult)
      applyActiveSection(sectionResult)
    } catch (error) {
      setStudentError(error instanceof Error ? error.message : 'Unable to load students.')
    } finally {
      setStudentLoading(false)
    }
  }

  const loadSections = async () => {
    setSectionLoading(true)
    setSectionError('')
    try {
      const sectionResult = await attendanceRequest('/sections')
      setSections(sectionResult)
      applyActiveSection(sectionResult)
      setSectionReady(true)
    } catch (error) {
      setSectionError(error instanceof Error ? error.message : 'Unable to load sections.')
    } finally {
      setSectionLoading(false)
    }
  }

  useEffect(() => {
    if (!session) return
    if (activeMenu === 'Students') void loadStudents()
    if (activeMenu === 'Sections') void loadSections()
  }, [activeMenu, session])

  useEffect(() => {
    if (!session || activeMenu !== 'Events' || !selectedSectionId) return
    setEventLoading(true)
    setEventError('')
    attendanceRequest(`/notification-events?sectionId=${selectedSectionId}`)
      .then((result) => setEvents(result))
      .catch((error: unknown) => setEventError(error instanceof Error ? error.message : 'Unable to load events.'))
      .finally(() => setEventLoading(false))
  }, [activeMenu, selectedSectionId, session])

  const createEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEventError('')
    try {
      const createdEvent = await attendanceRequest('/notification-events', { method: 'POST', body: JSON.stringify({ sectionId: Number(selectedSectionId), title: eventForm.title, content: eventForm.content, eventDate: new Date().toISOString() }) })
      setEvents((current) => [createdEvent, ...current])
      setEventForm({ title: '', content: '' })
    } catch (error) {
      setEventError(error instanceof Error ? error.message : 'Unable to create event.')
    }
  }

  useEffect(() => {
    if (session) void loadSections()
  }, [session])

  const applyActiveSection = (sectionResult: Section[]) => {
    const activeSections = sectionResult.filter((section) => section.isActive !== false)
    const storedSectionIsActive = activeSections.some((section) => String(section.sectionId) === selectedSectionId)
    const activeSection = storedSectionIsActive
      ? activeSections.find((section) => String(section.sectionId) === selectedSectionId)
      : activeSections[0]

    if (!activeSection) return

    const nextSectionId = String(activeSection.sectionId)
    setSelectedSectionId(nextSectionId)
    localStorage.setItem('attendance-section-id', nextSectionId)
    setStudentForm((current) => current.sectionId ? current : { ...current, sectionId: nextSectionId })
  }

  const createSection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSectionError('')
    try {
      const createdSection = await attendanceRequest('/sections', {
        method: 'POST',
        body: JSON.stringify({ sectionName, isActive: sectionIsActive }),
      })
      setSections((current) => [...current, createdSection])
      setSectionName('')
      setSectionIsActive(true)
      setShowSectionForm(false)
    } catch (error) {
      setSectionError(error instanceof Error ? error.message : 'Unable to create section.')
    }
  }

  const createStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStudentError('')
    try {
      const isEditing = editingStudentId !== null
      const savedStudent = await attendanceRequest(isEditing ? `/students/${editingStudentId}` : '/students', {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...studentForm,
          sectionId: Number(studentForm.sectionId),
        }),
      })
      setStudents((current) => isEditing
        ? current.map((student) => student.studentId === editingStudentId ? savedStudent : student)
        : [...current, savedStudent])
      setStudentForm({ firstName: '', middleName: '', lastName: '', email: '', phoneNumber: '', sectionId: sections[0] ? String(sections[0].sectionId) : '' })
      setShowStudentForm(false)
      setEditingStudentId(null)
    } catch (error) {
      setStudentError(error instanceof Error ? error.message : 'Unable to create student.')
    }
  }

  const editStudent = (student: Student) => {
    setEditingStudentId(student.studentId)
    setStudentForm({
      firstName: student.firstName,
      middleName: student.middleName ?? '',
      lastName: student.lastName,
      email: student.email ?? '',
      phoneNumber: student.phoneNumber ?? '',
      sectionId: String(student.sectionId),
    })
    setShowStudentForm(true)
  }

  const deleteStudent = async (studentId: number) => {
    if (!window.confirm('Delete this student?')) return
    try {
      await attendanceRequest(`/students/${studentId}`, { method: 'DELETE' })
      setStudents((current) => current.filter((student) => student.studentId !== studentId))
    } catch (error) {
      setStudentError(error instanceof Error ? error.message : 'Unable to delete student.')
    }
  }

  const openGuardian = async (student: Student) => {
    setGuardianStudent(student)
    setGuardianError('')
    setGuardianLoading(true)
    try {
      const guardian = await attendanceRequest(`/students/${student.studentId}/guardian`) as Guardian
      setGuardianForm({ firstName: guardian.firstName, middleName: guardian.middleName ?? '', lastName: guardian.lastName, email: guardian.email ?? '', contactNumber: guardian.contactNumber, relationshipType: guardian.relationshipType ?? '' })
    } catch (error) {
      setGuardianForm({ firstName: '', middleName: '', lastName: '', email: '', contactNumber: '', relationshipType: '' })
      if (error instanceof Error && !error.message.includes('No guardian is registered')) setGuardianError(error.message)
    } finally {
      setGuardianLoading(false)
    }
  }

  const saveGuardian = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!guardianStudent) return
    setGuardianError('')
    try {
      await attendanceRequest(`/students/${guardianStudent.studentId}/guardian`, { method: 'PUT', body: JSON.stringify(guardianForm) })
      setGuardianStudent(null)
    } catch (error) {
      setGuardianError(error instanceof Error ? error.message : 'Unable to save guardian.')
    }
  }

  const selectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId)
    localStorage.setItem('attendance-section-id', sectionId)
    setStudentForm((current) => ({ ...current, sectionId }))
  }

  const toggleSection = async (section: Section) => {
    try {
      const updatedSection = await attendanceRequest(`/sections/${section.sectionId}`, {
        method: 'PUT',
        body: JSON.stringify({ sectionName: section.sectionName, isActive: !section.isActive }),
      })
      setSections((current) => current.map((item) => {
        if (item.sectionId === section.sectionId) return updatedSection
        return updatedSection.isActive ? { ...item, isActive: false } : item
      }))
      if (updatedSection.isActive) {
        selectSection(String(updatedSection.sectionId))
      } else if (section.isActive && String(section.sectionId) === selectedSectionId) {
        setSelectedSectionId('')
        localStorage.removeItem('attendance-section-id')
      }
    } catch (error) {
      setSectionError(error instanceof Error ? error.message : 'Unable to update section.')
    }
  }

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      const response = await fetch(`${apiBase}/User/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Unable to sign in.')
      }

      const result = await response.json()
      const nextSession = {
        token: result.token,
        userId: result.userId,
        username: result.username,
        fullName: result.fullName,
        role: result.role,
        databaseName: result.databaseName,
        accountName: result.accountName,
        companyDescription: result.companyDescription,
      }

      localStorage.setItem('attendance-session', JSON.stringify(nextSession))
      setSession(nextSession)
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('attendance-session')
    setSession(null)
  }

  if (!session) {
    return (
      <main className="login-page">
        <section className="login-card card">
          <p className="eyebrow">Attendance Portal</p>
          <h1>Welcome back</h1>
          <p className="login-intro">Sign in to manage students, attendance, and school notifications.</p>
          <form className="login-form" onSubmit={handleLogin}>
            <label>Account<input required value={loginForm.account} onChange={(event) => setLoginForm({ ...loginForm, account: event.target.value })} placeholder="School account" /></label>
            <label>Username<input required value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} placeholder="Your username" /></label>
            <label>Password<input required type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Your password" /></label>
            {loginError && <p className="login-error" role="alert">{loginError}</p>}
            <button type="submit" className="primary-btn login-btn" disabled={isLoggingIn}>{isLoggingIn ? 'Signing in...' : 'Sign in'}</button>
          </form>
        </section>
      </main>
    )
  }

  const renderTableView = () => {
    if (activeMenu === 'Students') {
      return (
        <section className="workspace-panel card">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Directory</p>
              <h2>Students</h2>
            </div>
            <button type="button" className="primary-btn" onClick={() => { setEditingStudentId(null); setShowStudentForm((current) => !current) }}>{showStudentForm ? 'Close' : 'Add Student'}</button>
          </div>
          {studentError && <p className="login-error" role="alert">{studentError}</p>}
          {showStudentForm && <form className="student-form" onSubmit={createStudent}>
            <label>First name <span className="required-mark">*</span><input required value={studentForm.firstName} onChange={(event) => setStudentForm({ ...studentForm, firstName: event.target.value })} /></label>
            <label>Middle name<input value={studentForm.middleName} onChange={(event) => setStudentForm({ ...studentForm, middleName: event.target.value })} /></label>
            <label>Last name <span className="required-mark">*</span><input required value={studentForm.lastName} onChange={(event) => setStudentForm({ ...studentForm, lastName: event.target.value })} /></label>
            <label>Email<input type="email" value={studentForm.email} onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })} /></label>
            <label>Phone<input value={studentForm.phoneNumber} onChange={(event) => setStudentForm({ ...studentForm, phoneNumber: event.target.value })} /></label>
            <div className="readonly-field"><span>Current section</span><strong>{sections.find((section) => String(section.sectionId) === selectedSectionId)?.sectionName || 'Preparing active section...'}</strong><small>Change the active section from the workspace selector above.</small></div>
            <div className="student-form-actions"><button type="submit" className="primary-btn">{editingStudentId === null ? 'Create Student' : 'Save Changes'}</button><span className="form-note">Student number and tracking code are generated automatically.</span></div>
          </form>}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>Section</th><th>Student No.</th><th>Tracking Code</th><th>Action</th></tr></thead>
              <tbody>
                {studentLoading && <tr><td colSpan={5}>Loading students...</td></tr>}
                {!studentLoading && students.length === 0 && <tr><td colSpan={5}>No students found.</td></tr>}
                {!studentLoading && students.filter((student) => !selectedSectionId || String(student.sectionId) === selectedSectionId).map((student) => <tr key={student.studentId}><td>{[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')}</td><td>{sections.find((section) => section.sectionId === student.sectionId)?.sectionName ?? `Section ${student.sectionId}`}</td><td>{student.schoolStudentNumber}</td><td><code>{student.trackingCode}</code></td><td><div className="row-actions"><button type="button" className="text-btn" onClick={() => editStudent(student)}>Edit</button><button type="button" className="text-btn" onClick={() => void openGuardian(student)}>Guardian</button><button type="button" className="text-btn" onClick={() => setQrStudent(student)}>QR</button><button type="button" className="text-btn danger-btn" onClick={() => void deleteStudent(student.studentId)}>Delete</button></div></td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      )
    }

    if (activeMenu === 'Attendance') {
      return <AttendanceScanner attendanceApiBase={attendanceApiBase} token={session.token} selectedSectionId={selectedSectionId} sectionReady={sectionReady} />
    }

    if (activeMenu === 'Events') {
      return (
        <section className="workspace-panel card"><div className="page-heading"><div><p className="eyebrow">Communication</p><h2>Events & Notifications</h2></div><span className="badge">Active section</span></div>{eventError && <p className="login-error" role="alert">{eventError}</p>}<form className="event-form" onSubmit={createEvent}><label>Title *<input required value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} placeholder="School announcement" /></label><label>Message *<textarea required rows={4} value={eventForm.content} onChange={(event) => setEventForm({ ...eventForm, content: event.target.value })} placeholder="Write the event or notification details..." /></label><button type="submit" className="primary-btn">Create Event</button></form><div className="table-wrap"><table><thead><tr><th>Date</th><th>Title</th><th>Details</th></tr></thead><tbody>{eventLoading ? <tr><td colSpan={3}>Loading events...</td></tr> : events.length === 0 ? <tr><td colSpan={3}>No events or notifications for this section.</td></tr> : events.map((item) => <tr key={item.eventId}><td>{item.eventDate ? new Date(item.eventDate).toLocaleDateString() : '-'}</td><td>{item.title}</td><td>{item.content}</td></tr>)}</tbody></table></div></section>
      )
    }

    if (activeMenu === 'Sections') {
      return (
        <section className="workspace-panel card"><div className="page-heading"><div><p className="eyebrow">Organization</p><h2>Sections</h2></div><button type="button" className="primary-btn" onClick={() => setShowSectionForm((current) => !current)}>{showSectionForm ? 'Close' : 'Add Section'}</button></div>
          {sectionError && <p className="login-error" role="alert">{sectionError}</p>}
          {showSectionForm && <form className="section-form" onSubmit={createSection}><label>Section name <span className="required-mark">*</span><input required value={sectionName} onChange={(event) => setSectionName(event.target.value)} placeholder="Grade 5-A" /></label><label className="checkbox-field"><input type="checkbox" checked={sectionIsActive} onChange={(event) => setSectionIsActive(event.target.checked)} /> Active section</label><button type="submit" className="primary-btn">Create Section</button></form>}
          <div className="section-cards">{sectionLoading && <p>Loading sections...</p>}{!sectionLoading && sections.length === 0 && <p>No sections found. Create a section before adding students.</p>}{!sectionLoading && sections.map((section) => <div key={section.sectionId} className={section.isActive !== false ? 'active-section' : 'inactive-section'}><strong>{section.sectionName}</strong><span>{section.isActive !== false ? 'Active' : 'Inactive'}</span><small>{section.isActive !== false ? 'Currently selected for student assignment' : 'Select this section to make it active'}</small>{section.isActive === false && <button type="button" className="activate-section-btn" onClick={() => void toggleSection(section)}>Set active</button>}</div>)}</div>
        </section>
      )
    }

    return (
      <section className="dashboard-grid">
        <div className="workspace-panel card welcome-panel"><p className="eyebrow">Teacher workspace</p><h2>Attendance is ready to connect.</h2><p>Use Students and Sections to prepare the school data before enabling QR attendance.</p><button type="button" className="primary-btn" onClick={() => setActiveMenu('Students')}>Manage Students</button></div>
        <div className="workspace-panel card"><div className="page-heading"><div><p className="eyebrow">Today</p><h2>Attendance pulse</h2></div><span className="badge neutral">Awaiting data</span></div><div className="empty-state compact"><strong>No attendance yet.</strong><span>Records will appear after teacher scans are enabled.</span></div></div>
        <div className="workspace-panel card"><div className="page-heading"><div><p className="eyebrow">Latest</p><h2>Notifications</h2></div><button type="button" className="text-btn" onClick={() => setActiveMenu('Events')}>Open events</button></div><div className="empty-state compact"><strong>No notifications yet.</strong><span>School updates will appear here when published.</span></div></div>
      </section>
    )
  }

  return (
    <div className="attendance-shell">
      <header className="topbar"><div><p className="eyebrow">Attendance Portal</p><h1>Teacher Workspace</h1><div className="context-line"><p className="company-description">{session.companyDescription || session.accountName || session.databaseName}</p><p className="selected-section-name">{sections.find((section) => String(section.sectionId) === selectedSectionId)?.sectionName || 'No active section selected'}</p></div></div><div className="profile-actions"><label className="section-switcher">Section<select value={selectedSectionId} onChange={(event) => selectSection(event.target.value)}><option value="">All active sections</option>{sections.filter((section) => section.isActive !== false).map((section) => <option key={section.sectionId} value={section.sectionId}>{section.sectionName}</option>)}</select></label><div className="profile-chip"><span className="avatar">{(session.fullName || session.username).slice(0, 2).toUpperCase()}</span><span>{session.fullName || session.username}<small>{session.role}</small></span></div><button type="button" className="text-btn" onClick={handleLogout}>Sign out</button></div></header>
      <div className="app-layout">
        <nav className="sidebar" aria-label="Main navigation"><p className="nav-title">Workspace</p>{menuItems.map((item) => <button type="button" key={item} className={activeMenu === item ? 'nav-item active' : 'nav-item'} onClick={() => setActiveMenu(item)}><span className="nav-icon">{item === 'Dashboard' ? '⌂' : item === 'Students' ? '○' : item === 'Attendance' ? '✓' : item === 'Events' ? '!' : item === 'Sections' ? '▦' : '↗'}</span>{item}</button>)}<div className="sidebar-footer"><strong>{session.accountName || session.databaseName}</strong><small className="school-description">{session.companyDescription || 'Company description not set'}</small></div></nav>
        <main className="workspace-content">
          {activeMenu === 'Guardian View' ? <GuardianPage /> : false ? <section className="content-grid">
        <section className="lookup-panel card">
          <div className="lookup-header">
            <h2>Guardian Access</h2>
            <span className="badge">Public lookup</span>
          </div>

          <label className="field-label" htmlFor="tracking-code">
            Student tracking code
          </label>
          <div className="lookup-row">
            <input
              id="tracking-code"
              type="text"
              placeholder="Enter tracking code"
              defaultValue="STU-1042"
            />
            <button type="button">View</button>
          </div>

          <div className="student-summary">
            <div>
              <span className="label">Student</span>
              <strong>Maria Smith</strong>
            </div>
            <div>
              <span className="label">Section</span>
              <strong>Grade 5-A</strong>
            </div>
            <div>
              <span className="label">Date</span>
              <strong>2026-09-20</strong>
            </div>
          </div>

          <div className="tabs" role="tablist" aria-label="Attendance tabs">
            <button
              type="button"
              className={activeTab === 'attendance' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('attendance')}
            >
              Attendance
            </button>
            <button
              type="button"
              className={activeTab === 'events' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('events')}
            >
              Events & Notifications
            </button>
          </div>

          {activeTab === 'attendance' ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{row.checkIn}</td>
                      <td>{row.checkOut}</td>
                      <td>
                        <span className={row.status === 'Late' ? 'status late' : 'status present'}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRows.map((row) => (
                    <tr key={`${row.date}-${row.title}`}>
                      <td>{row.date}</td>
                      <td>{row.title}</td>
                      <td>{row.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="teacher-panel card">
          <div className="lookup-header">
            <h2>Teacher Event</h2>
            <span className="badge neutral">Draft</span>
          </div>

          <form className="teacher-form">
            <label>
              Title
              <input type="text" placeholder="School announcement" defaultValue="Parents Meeting" />
            </label>

            <label>
              Section
              <select defaultValue="Grade 5-A">
                <option>Grade 5-A</option>
                <option>Grade 5-B</option>
                <option>Grade 6-A</option>
              </select>
            </label>

            <label>
              Message
              <textarea
                rows={5}
                placeholder="Write the event or notification details..."
                defaultValue="Parents meeting will take place tomorrow at 4:00 PM. Kindly arrive early."
              />
            </label>

            <button type="button" className="primary-btn">
              Create Event
            </button>
          </form>
        </aside>
          </section> : renderTableView()}
        </main>
      </div>
      {guardianStudent && <div className="modal-backdrop" role="presentation" onClick={() => setGuardianStudent(null)}>
        <form className="guardian-modal card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} onSubmit={saveGuardian}>
          <div className="lookup-header"><div><p className="eyebrow">Guardian information</p><h2>{[guardianStudent.firstName, guardianStudent.middleName, guardianStudent.lastName].filter(Boolean).join(' ')}</h2></div><button type="button" className="text-btn" onClick={() => setGuardianStudent(null)}>Close</button></div>
          {guardianLoading ? <div className="empty-state compact"><strong>Loading guardian information...</strong></div> : <><div className="guardian-form-grid"><label>First name *<input required value={guardianForm.firstName} onChange={(event) => setGuardianForm({ ...guardianForm, firstName: event.target.value })} /></label><label>Middle name<input value={guardianForm.middleName} onChange={(event) => setGuardianForm({ ...guardianForm, middleName: event.target.value })} /></label><label>Last name *<input required value={guardianForm.lastName} onChange={(event) => setGuardianForm({ ...guardianForm, lastName: event.target.value })} /></label><label>Relationship<input value={guardianForm.relationshipType} onChange={(event) => setGuardianForm({ ...guardianForm, relationshipType: event.target.value })} placeholder="Parent or guardian" /></label><label>Email<input type="email" value={guardianForm.email} onChange={(event) => setGuardianForm({ ...guardianForm, email: event.target.value })} /></label><label>Emergency contact number *<input required value={guardianForm.contactNumber} onChange={(event) => setGuardianForm({ ...guardianForm, contactNumber: event.target.value })} /></label></div>{guardianError && <p className="login-error" role="alert">{guardianError}</p>}<button type="submit" className="primary-btn">Save Guardian</button></>}
        </form>
      </div>}
      {qrStudent && <div className="modal-backdrop" role="presentation" onClick={() => setQrStudent(null)}>
        <section className="qr-modal card" role="dialog" aria-modal="true" aria-labelledby="qr-title" onClick={(event) => event.stopPropagation()}>
          <div className="lookup-header"><div><p className="eyebrow">Student QR code</p><h2 id="qr-title">{[qrStudent.firstName, qrStudent.middleName, qrStudent.lastName].filter(Boolean).join(' ')}</h2></div><button type="button" className="text-btn" onClick={() => setQrStudent(null)}>Close</button></div>
          <div className="qr-code"><QRCodeSVG value={qrStudent.trackingCode} size={220} includeMargin /></div>
          <p className="qr-caption">Scan this code to identify the student.</p>
          <code className="qr-tracking-code">{qrStudent.trackingCode}</code>
        </section>
      </div>}
    </div>
  )
}

export default App
