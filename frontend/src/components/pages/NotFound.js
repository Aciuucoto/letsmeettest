import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NotFoundContainer = styled.div`
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background-color: #f9fafb;
`;

const ErrorCode = styled.h1`
  font-size: 8rem;
  font-weight: 800;
  color: #4f46e5;
  margin: 0;
  line-height: 1;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Title = styled.h2`
  font-size: 2rem;
  color: #1f2937;
  margin: 1rem 0;
`;

const Message = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 2rem;
  max-width: 500px;
`;

const HomeButton = styled(Link)`
  display: inline-block;
  background-color: #4f46e5;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    background-color: #4338ca;
    transform: translateY(-2px);
  }
`;

const NotFound = () => {
  return (
    <NotFoundContainer>
      <ErrorCode>404</ErrorCode>
      <Title>Page Not Found</Title>
      <Message>
        Oops! The page you're looking for doesn't exist or has been moved.
        Let's get you back on track.
      </Message>
      <HomeButton to="/">Return Home</HomeButton>
    </NotFoundContainer>
  );
};

export default NotFound; 