import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';

// Lazy load all other pages
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const EntityManagement = lazy(() => import('./pages/EntityManagement'));
const UsersNew = lazy(() => import('./pages/UsersNew'));
const AddUserNew = lazy(() => import('./pages/AddUserNew'));
const EditUserNew = lazy(() => import('./pages/EditUserNew'));
const Employees = lazy(() => import('./pages/Employees'));
const AddEmployee = lazy(() => import('./pages/AddEmployee'));
const EditEmployee = lazy(() => import('./pages/EditEmployee'));
const CRM = lazy(() => import('./pages/CRM'));
const Accounts = lazy(() => import('./pages/Accounts'));
const ViewAccount = lazy(() => import('./pages/ViewAccount'));
const Ships = lazy(() => import('./pages/Ships'));
const Crews = lazy(() => import('./pages/Crews'));
const Contacts = lazy(() => import('./pages/Contacts'));
const ManningAgents = lazy(() => import('./pages/ManningAgents'));
const Competition = lazy(() => import('./pages/Competition'));
const Sales = lazy(() => import('./pages/Sales'));
const Visits = lazy(() => import('./pages/Visits'));
const Communication = lazy(() => import('./pages/Communication'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const PagePermissions = lazy(() => import('./pages/PagePermissions'));
const HRManagement = lazy(() => import('./pages/HRManagement'));
const Assets = lazy(() => import('./pages/Assets'));
const ITSupport = lazy(() => import('./pages/ITSupport'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Applicants = lazy(() => import('./pages/Applicants'));
const WebsiteManagement = lazy(() => import('./pages/WebsiteManagement'));
const ArticleManagement = lazy(() => import('./pages/ArticleManagement'));
const ArticleEditor = lazy(() => import('./pages/ArticleEditor'));
const MediaManagement = lazy(() => import('./pages/MediaManagement'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
  console.log('App component rendering');
  return (
    <Router basename="/intranet">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="admin" element={
            <Suspense fallback={<PageLoader />}>
              <AdminPanel />
            </Suspense>
          } />
          <Route path="admin/roles" element={
            <Suspense fallback={<PageLoader />}>
              <RoleManagement />
            </Suspense>
          } />
          <Route path="admin/page-access" element={
            <Suspense fallback={<PageLoader />}>
              <PagePermissions />
            </Suspense>
          } />
          <Route path="entities" element={
            <Suspense fallback={<PageLoader />}>
              <EntityManagement />
            </Suspense>
          } />
          <Route path="users" element={
            <Suspense fallback={<PageLoader />}>
              <UsersNew />
            </Suspense>
          } />
          <Route path="users/add" element={
            <Suspense fallback={<PageLoader />}>
              <AddUserNew />
            </Suspense>
          } />
          <Route path="users/edit/:id" element={
            <Suspense fallback={<PageLoader />}>
              <EditUserNew />
            </Suspense>
          } />
          <Route path="crm" element={
            <Suspense fallback={<PageLoader />}>
              <CRM />
            </Suspense>
          } />
          <Route path="crm/accounts" element={
            <Suspense fallback={<PageLoader />}>
              <Accounts />
            </Suspense>
          } />
          <Route path="crm/accounts/:id" element={
            <Suspense fallback={<PageLoader />}>
              <ViewAccount />
            </Suspense>
          } />
          <Route path="crm/ships" element={
            <Suspense fallback={<PageLoader />}>
              <Ships />
            </Suspense>
          } />
          <Route path="crm/crews" element={
            <Suspense fallback={<PageLoader />}>
              <Crews />
            </Suspense>
          } />
          <Route path="crm/contacts" element={
            <Suspense fallback={<PageLoader />}>
              <Contacts />
            </Suspense>
          } />
          <Route path="crm/manning-agents" element={
            <Suspense fallback={<PageLoader />}>
              <ManningAgents />
            </Suspense>
          } />
          <Route path="crm/competition" element={
            <Suspense fallback={<PageLoader />}>
              <Competition />
            </Suspense>
          } />
          <Route path="crm/sales" element={
            <Suspense fallback={<PageLoader />}>
              <Sales />
            </Suspense>
          } />
          <Route path="crm/visits" element={
            <Suspense fallback={<PageLoader />}>
              <Visits />
            </Suspense>
          } />
          <Route path="crm/communication" element={
            <Suspense fallback={<PageLoader />}>
              <Communication />
            </Suspense>
          } />
          <Route path="hr" element={
            <Suspense fallback={<PageLoader />}>
              <HRManagement />
            </Suspense>
          } />
          <Route path="hr/employees" element={
            <Suspense fallback={<PageLoader />}>
              <Employees />
            </Suspense>
          } />
          <Route path="hr/employees/add" element={
            <Suspense fallback={<PageLoader />}>
              <AddEmployee />
            </Suspense>
          } />
          <Route path="hr/employees/:id/edit" element={
            <Suspense fallback={<PageLoader />}>
              <EditEmployee />
            </Suspense>
          } />
          <Route path="hr/applicants" element={
            <Suspense fallback={<PageLoader />}>
              <Applicants />
            </Suspense>
          } />
          <Route path="assets" element={
            <Suspense fallback={<PageLoader />}>
              <Assets />
            </Suspense>
          } />
          <Route path="support" element={
            <Suspense fallback={<PageLoader />}>
              <ITSupport />
            </Suspense>
          } />
          <Route path="projects" element={
            <Suspense fallback={<PageLoader />}>
              <Projects />
            </Suspense>
          } />
          <Route path="projects/new" element={
            <Suspense fallback={<PageLoader />}>
              <ProjectDetail />
            </Suspense>
          } />
          <Route path="projects/:id" element={
            <Suspense fallback={<PageLoader />}>
              <ProjectDetail />
            </Suspense>
          } />
          <Route path="websites" element={
            <Suspense fallback={<PageLoader />}>
              <WebsiteManagement />
            </Suspense>
          } />
          <Route path="websites/:websiteId/articles" element={
            <Suspense fallback={<PageLoader />}>
              <ArticleManagement />
            </Suspense>
          } />
          <Route path="websites/:websiteId/articles/new" element={
            <Suspense fallback={<PageLoader />}>
              <ArticleEditor />
            </Suspense>
          } />
          <Route path="websites/:websiteId/articles/:articleId/edit" element={
            <Suspense fallback={<PageLoader />}>
              <ArticleEditor />
            </Suspense>
          } />
          <Route path="websites/:websiteId/media" element={
            <Suspense fallback={<PageLoader />}>
              <MediaManagement />
            </Suspense>
          } />
          {/* Catch all route for undefined routes */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;