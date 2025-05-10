import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import userService from '../../services/userService';

const Nav = styled.nav`
  background-color: #ffffff;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  text-decoration: none;
  
  &:hover {
    color: #666;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: #333;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    color: #666;
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: #0056b3;
  }
`;

const Navbar = () => {
  const navigate = useNavigate();
  const currentUser = userService.getCurrentUser();

  const handleLogout = () => {
    userService.logout();
    navigate('/login');
  };

  return (
    <Nav>
      <NavContainer>
        <Logo to="/">LetsMeet</Logo>
        <NavLinks>
          {currentUser ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <Button onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </NavLinks>
      </NavContainer>
    </Nav>
  );
};

export default Navbar; 