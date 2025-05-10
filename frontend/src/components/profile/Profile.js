import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import userService from '../../services/userService';

const ProfileContainer = styled.div`
  min-height: calc(100vh - 70px);
  padding: 2rem;
  background-color: #f9fafb;
`;

const ProfileCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const Button = styled.button`
  background-color: #4f46e5;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #4338ca;
  }
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  color: #059669;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #ecfdf5;
  border-radius: 4px;
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #fef2f2;
  border-radius: 4px;
`;

const ProfileInfo = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: #1f2937;
  font-weight: 500;
`;

const Profile = () => {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        setProfile(prev => ({
          ...prev,
          username: data.username,
          email: data.email
        }));
      } catch (err) {
        setError('Failed to load profile information');
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (profile.newPassword) {
        if (profile.newPassword !== profile.confirmPassword) {
          setError('New passwords do not match');
          setLoading(false);
          return;
        }
        if (!profile.currentPassword) {
          setError('Current password is required to change password');
          setLoading(false);
          return;
        }
      }

      await userService.updateProfile({
        username: profile.username,
        email: profile.email,
        currentPassword: profile.currentPassword,
        newPassword: profile.newPassword
      });

      setSuccess('Profile updated successfully');
      setProfile(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileContainer>
      <ProfileCard>
        <Title>Profile Settings</Title>
        
        <ProfileInfo>
          <FormGroup>
            <InfoLabel>Username</InfoLabel>
            <InfoValue>{profile.username}</InfoValue>
          </FormGroup>
          <FormGroup>
            <InfoLabel>Email</InfoLabel>
            <InfoValue>{profile.email}</InfoValue>
          </FormGroup>
        </ProfileInfo>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="username">Update Username</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={profile.username}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">Update Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={profile.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password to make changes"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              type="password"
              id="newPassword"
              name="newPassword"
              value={profile.newPassword}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              minLength="6"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={profile.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              minLength="6"
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </Form>
      </ProfileCard>
    </ProfileContainer>
  );
};

export default Profile; 