import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Search, Mic, Settings, User, LogOut, CreditCard, Phone, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://partsquest-backend-production.onrender.com'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState('landing')
  const [partRequests, setPartRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isListening, setIsListening] = useState(false)

  // Authentication functions
  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        // Check subscription status before allowing dashboard access
        if (data.user.subscription_status === 'active') {
          setCurrentView('dashboard')
          loadPartRequests()
        } else {
          setCurrentView('subscription-selection')
        }
      } else {
        alert(data.error || 'Login failed')
      }
    } catch (error) {
      alert('Network error: ' + error.message)
    }
    setLoading(false)
  }

  const register = async (userData) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        // Force redirect to subscription selection for new users
        // Do NOT call loadProfile here to prevent race condition
        setCurrentView('subscription-selection')
      } else {
        alert(data.error || 'Registration failed')
      }
    } catch (error) {
      alert('Network error: ' + error.message)
    }
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setCurrentView('login')
    setPartRequests([])
  }

  // Load user data on app start
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // If user has a token, load their profile and redirect appropriately
      loadProfile()
    }
    // If no token, stay on landing page (default currentView)
  }, [])

  const loadProfile = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
        // Only allow dashboard access for users with active subscriptions
        // Users with 'inactive' status must go through subscription selection
        if (data.user.subscription_status === 'active' || data.user.subscription_status === 'free') {
          setCurrentView('dashboard')
          loadPartRequests()
        } else {
          // Force subscription selection for inactive users
          setCurrentView('subscription-selection')
        }
      } else {
        logout()
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      logout()
    }
  }

  const loadPartRequests = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/part-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setPartRequests(data.part_requests || [])
      } else if (response.status === 403) {
        // Subscription required error
        setCurrentView('subscription-selection')
      }
    } catch (error) {
      console.error('Failed to load part requests:', error)
    }
  }

  const createPartRequest = async (partData) => {
    const token = localStorage.getItem('token')
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/part-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(partData)
      })
      const data = await response.json()
      if (response.ok) {
        loadPartRequests()
        alert('Part request created successfully!')
      } else if (response.status === 403) {
        // Subscription required error
        alert('Subscription required to create part requests. Please upgrade your plan.')
        setCurrentView('subscription-selection')
      } else {
        alert(data.error || 'Failed to create part request')
      }
    } catch (error) {
      alert('Network error: ' + error.message)
    }
    setLoading(false)
  }

  const startSubscription = async (priceId) => {
    const token = localStorage.getItem('token')
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ price_id: priceId })
      })
      const data = await response.json()
      if (response.ok) {
        window.location.href = data.checkout_url
      } else {
        alert(data.error || 'Failed to start subscription')
      }
    } catch (error) {
      alert('Network error: ' + error.message)
    }
    setLoading(false)
  }

  // Voice recognition for AI calling
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser')
      return
    }

    const recognition = new webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setSearchQuery(transcript)
      // Here you would typically send this to your AI processing endpoint
      alert(`Voice input received: "${transcript}"\n\nThis would be processed by the AI system for parts search.`)
    }
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.start()
  }

  // Login/Register Form Component
  const AuthForm = ({ isRegisterMode = false }) => {
    const [isLogin, setIsLogin] = useState(!isRegisterMode)
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      company: '',
      phone: ''
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      if (isLogin) {
        login(formData.email, formData.password)
      } else {
        register(formData)
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600">PartsQuest</CardTitle>
            <CardDescription>AI-Powered Parts Search & Procurement</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Dashboard Component
  const Dashboard = () => {
    const [newPartRequest, setNewPartRequest] = useState({
      part_number: '',
      description: '',
      quantity: 1,
      target_price: '',
      urgency: 'normal'
    })

    const handlePartRequestSubmit = (e) => {
      e.preventDefault()
      createPartRequest({
        ...newPartRequest,
        quantity: parseInt(newPartRequest.quantity),
        target_price: newPartRequest.target_price ? parseFloat(newPartRequest.target_price) : null
      })
      setNewPartRequest({
        part_number: '',
        description: '',
        quantity: 1,
        target_price: '',
        urgency: 'normal'
      })
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-blue-600">PartsQuest</h1>
                <Badge variant={user?.subscription_status === 'active' ? 'default' : 'secondary'} className="ml-3">
                  {user?.subscription_status === 'active' ? 'Pro' : 'Free'}
                </Badge>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user?.first_name}</span>
                <Button variant="ghost" size="sm" onClick={() => setCurrentView('profile')}>
                  <User className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="search" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="search">AI Search</TabsTrigger>
              <TabsTrigger value="requests">My Requests</TabsTrigger>
              <TabsTrigger value="voice">AI Calling</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </TabsList>

            {/* AI Search Tab */}
            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2" />
                    AI-Powered Parts Search
                  </CardTitle>
                  <CardDescription>
                    Search for parts using natural language or part numbers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Search for parts... (e.g., 'resistor 10k ohm' or 'LM358')"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={() => alert('AI search would process: ' + searchQuery)}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  {user?.subscription_status !== 'active' && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">
                          Upgrade to Pro for unlimited AI-powered searches and advanced features
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* New Part Request Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Create Part Request</CardTitle>
                  <CardDescription>Submit a new part procurement request</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePartRequestSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="part_number">Part Number</Label>
                        <Input
                          id="part_number"
                          value={newPartRequest.part_number}
                          onChange={(e) => setNewPartRequest({...newPartRequest, part_number: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={newPartRequest.quantity}
                          onChange={(e) => setNewPartRequest({...newPartRequest, quantity: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newPartRequest.description}
                        onChange={(e) => setNewPartRequest({...newPartRequest, description: e.target.value})}
                        placeholder="Describe the part specifications, requirements, etc."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="target_price">Target Price ($)</Label>
                        <Input
                          id="target_price"
                          type="number"
                          step="0.01"
                          value={newPartRequest.target_price}
                          onChange={(e) => setNewPartRequest({...newPartRequest, target_price: e.target.value})}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="urgency">Urgency</Label>
                        <Select value={newPartRequest.urgency} onValueChange={(value) => setNewPartRequest({...newPartRequest, urgency: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Request'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Requests Tab */}
            <TabsContent value="requests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Part Requests</CardTitle>
                  <CardDescription>Track your submitted part requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {partRequests.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No part requests yet. Create your first request in the AI Search tab.</p>
                  ) : (
                    <div className="space-y-4">
                      {partRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{request.part_number}</h3>
                              <p className="text-sm text-gray-600">{request.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Qty: {request.quantity}</span>
                                {request.target_price && <span>Target: ${request.target_price}</span>}
                                <span>Urgency: {request.urgency}</span>
                              </div>
                            </div>
                            <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Voice Calling Tab */}
            <TabsContent value="voice" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    AI Voice Calling
                  </CardTitle>
                  <CardDescription>
                    Use voice commands to search for parts and place orders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Button
                      size="lg"
                      onClick={startVoiceSearch}
                      disabled={isListening}
                      className={`${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                    >
                      <Mic className={`h-5 w-5 mr-2 ${isListening ? 'animate-pulse' : ''}`} />
                      {isListening ? 'Listening...' : 'Start Voice Search'}
                    </Button>
                  </div>
                  {searchQuery && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Voice Input:</strong> {searchQuery}
                      </p>
                    </div>
                  )}
                  {user?.subscription_status !== 'active' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">
                          AI Voice Calling is available for Pro subscribers only
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Free Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle>Free Plan</CardTitle>
                    <CardDescription>Basic parts search functionality</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />5 searches per day</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Basic part database</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Email support</li>
                    </ul>
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      Pro Plan
                      <Zap className="h-5 w-5 ml-2 text-yellow-500" />
                    </CardTitle>
                    <CardDescription>Advanced AI-powered features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">$49<span className="text-sm font-normal">/month</span></div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Unlimited AI searches</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />AI voice calling</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Advanced analytics</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Priority support</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />API access</li>
                    </ul>
                    <Button 
                      className="w-full" 
                      onClick={() => startSubscription('price_1QKxJhJNcmPXDtNg8YQzQhWx')}
                      disabled={loading || user?.subscription_status === 'active'}
                    >
                      {user?.subscription_status === 'active' ? 'Active' : (loading ? 'Processing...' : 'Upgrade to Pro')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  // Profile Management Component
  const ProfileView = () => {
    const [profileData, setProfileData] = useState({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      company: user?.company || '',
      phone: user?.phone || ''
    })

    const handleProfileUpdate = async (e) => {
      e.preventDefault()
      const token = localStorage.getItem('token')
      if (!token) return

      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(profileData)
        })
        const data = await response.json()
        if (response.ok) {
          setUser(data.user)
          alert('Profile updated successfully!')
        } else {
          alert(data.error || 'Failed to update profile')
        }
      } catch (error) {
        alert('Network error: ' + error.message)
      }
      setLoading(false)
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-bold text-blue-600">Profile Settings</h1>
              <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Subscription Selection Component
  const SubscriptionSelection = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Welcome, {user?.first_name}!</h1>
            <p className="text-gray-600">Choose your PartsQuest subscription plan to get started</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Test Plan */}
            <Card className="border-blue-200 bg-blue-50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">RECOMMENDED</Badge>
              </div>
              <CardHeader>
                <CardTitle>Test Plan</CardTitle>
                <CardDescription>Perfect for testing all features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">$0.50<span className="text-sm font-normal">/month</span></div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />5 voice calls</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />10 web searches</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />2 vehicles</li>
                </ul>
                <Button 
                  className="w-full" 
                  onClick={() => startSubscription('price_1RyNopKAQFTUDRwnEcbiX8RQ')}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Start Test'}
                </Button>
              </CardContent>
            </Card>

            {/* Starter Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Essential features for small teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">$199<span className="text-sm font-normal">/month</span></div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />10 voice calls</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />50 web searches</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />5 vehicles</li>
                </ul>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => startSubscription('price_1RyNwlKAQFTUDRwnVWZpwUn3')}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center">
                  Professional
                  <Zap className="h-5 w-5 ml-2 text-yellow-500" />
                </CardTitle>
                <CardDescription>Advanced AI-powered features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">$399<span className="text-sm font-normal">/month</span></div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />50 voice calls</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />200 web searches</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />25 vehicles</li>
                </ul>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => startSubscription('price_1RyNy2KAQFTUDRwnKOU8UfD3')}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>

            {/* Fleet Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Fleet</CardTitle>
                <CardDescription>For large operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">$699<span className="text-sm font-normal">/month</span></div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />150 voice calls</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />500 web searches</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />100 vehicles</li>
                </ul>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => startSubscription('price_1RyNzDKAQFTUDRwnv3XmIOFk')}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>Unlimited everything</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">$1200<span className="text-sm font-normal">/month</span></div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Unlimited calls</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Unlimited searches</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Unlimited vehicles</li>
                </ul>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => startSubscription('price_1RyO0HKAQFTUDRwnDQSDomWt')}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Need help choosing? <a href="#" className="text-blue-500">Contact our team</a>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              You can upgrade or downgrade your plan at any time from your dashboard
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Landing Page Component
  const LandingPage = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <img src="/partsquest-logo.png" alt="PartsQuest" className="h-10 w-auto" />
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => setCurrentView('login')}>
                  Sign In
                </Button>
                <Button onClick={() => setCurrentView('register')}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Auto Parts with <span className="text-blue-600">AI-Powered Search</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Stop wasting time calling suppliers one by one. Our AI assistant calls multiple parts 
              suppliers simultaneously while searching online catalogs to find the best prices and 
              availability for your auto parts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4" onClick={() => setCurrentView('register')}>
                <Zap className="mr-2 h-5 w-5" />
                Start Free Search
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <Phone className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Reduce Search Time by 90%
              </h2>
              <p className="text-lg text-gray-600">
                From 30-45 minutes to 30-60 seconds
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Voice Calling</h3>
                <p className="text-gray-600">
                  Our AI assistant calls multiple suppliers simultaneously, navigating phone trees and speaking 
                  with parts departments to get real-time pricing and availability.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Web Search</h3>
                <p className="text-gray-600">
                  Simultaneously searches major online parts catalogs including RockAuto, AutoZone, and Advance Auto 
                  Parts for comprehensive coverage.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Unified Results</h3>
                <p className="text-gray-600">
                  All results are aggregated and compared in one dashboard, showing you the best prices, availability, 
                  and supplier information in minutes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Choose Your Plan
              </h2>
              <p className="text-lg text-gray-600">
                Start with our test plan and scale as you grow
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
              {/* Test Plan */}
              <Card className="relative border-blue-200">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600">Recommended</Badge>
                </div>
                <CardHeader>
                  <CardTitle>Test Plan</CardTitle>
                  <CardDescription>Try it out</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">$0.50<span className="text-sm font-normal">/month</span></div>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />1 call per month</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />5 searches per month</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />1 vehicle</li>
                  </ul>
                  <Button className="w-full" onClick={() => setCurrentView('login')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Starter Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>For small shops</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">$199<span className="text-sm font-normal">/month</span></div>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />50 calls per month</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />200 searches per month</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />10 vehicles</li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => setCurrentView('login')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Professional Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional</CardTitle>
                  <CardDescription>For growing shops</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">$399<span className="text-sm font-normal">/month</span></div>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />150 calls per month</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />500 searches per month</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />25 vehicles</li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => setCurrentView('login')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Fleet Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Fleet</CardTitle>
                  <CardDescription>For large operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">$699<span className="text-sm font-normal">/month</span></div>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />300 calls per month</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />1000 searches per month</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />50 vehicles</li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => setCurrentView('login')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Unlimited everything</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">$1200<span className="text-sm font-normal">/month</span></div>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Unlimited calls</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Unlimited searches</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Unlimited vehicles</li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => setCurrentView('login')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="text-2xl font-bold">PartsQuest</span>
              </div>
              <p className="text-gray-400 mb-4">
                AI-powered automotive parts sourcing for independent repair shops
              </p>
              <p className="text-sm text-gray-500">
                © 2024 PartsQuest. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // Render appropriate view
  if (currentView === 'landing') {
    return <LandingPage />
  } else if (currentView === 'login') {
    return <AuthForm />
  } else if (currentView === 'register') {
    return <AuthForm isRegisterMode={true} />
  } else if (currentView === 'subscription-selection') {
    return <SubscriptionSelection />
  } else if (currentView === 'profile') {
    return <ProfileView />
  } else {
    return <Dashboard />
  }
}

export default App

