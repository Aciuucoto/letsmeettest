import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const LandingContainer = styled.div`
  min-height: calc(100vh - 70px);
`;

const Hero = styled.section`
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  padding: 6rem 2rem;
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  font-weight: 800;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
`;

const CTAButton = styled(Link)`
  display: inline-block;
  background-color: white;
  color: #4f46e5;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const Features = styled.section`
  padding: 5rem 2rem;
  background-color: #f9fafb;
`;

const FeaturesGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem 0;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin: 1rem 0;
  color: #1f2937;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
`;

const Landing = () => {
  return (
    <LandingContainer>
      <Hero>
        <HeroContent>
          <Title>Find Your Perfect Meeting Time</Title>
          <Subtitle>
            LetsMeet helps you coordinate schedules and find the best time to meet with your team, friends, or colleagues.
          </Subtitle>
          <CTAButton to="/register">Get Started</CTAButton>
        </HeroContent>
      </Hero>

      <Features>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureTitle>Smart Scheduling</FeatureTitle>
            <FeatureDescription>
              Our intelligent algorithm finds the best meeting times based on everyone's availability.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureTitle>Real-time Updates</FeatureTitle>
            <FeatureDescription>
              Get instant notifications when meeting times are confirmed or changed.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureTitle>Easy Integration</FeatureTitle>
            <FeatureDescription>
              Seamlessly connect with your favorite calendar apps and stay organized.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </Features>
    </LandingContainer>
  );
};

export default Landing; 