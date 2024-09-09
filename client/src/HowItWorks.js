import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

const steps = [
  {
    title: "1. Select Categories",
    description: "Choose from a wide range of Wikipedia categories that interest you or align with your expertise. This helps us find articles that match your interests and knowledge base.",
    icon: "🔍"
  },
  {
    title: "2. Select Task",
    description: "Using the Search Options button, choose wether you want to create new articles, or improve existing content.",
    icon: "📚"
  },
  {
    title: "3. Search",
    description: "Press the Search button to look for articles within your selected categories that need expansion or improvement.",
    icon: "👀"
  },
  {
    title: "4. Contribute",
    description: "Use your knowledge to expand and improve the articles, or add them to your watchlist. Your contributions help make Wikipedia a more comprehensive and valuable resource for everyone.",
    icon: "✍️"
  }
];

const Container = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const MinimizedContainer = styled(motion.div)`
  background-color: #f0f4f8;
  border: 2px solid #d0e1f9;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;

  &:hover {
    background-color: #e1eaf8;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const ExpandedContainer = styled(motion.div)`
  background-color: #ffffff;
  border: 2px solid #d0e1f9;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const StepContent = styled.div`
  margin-top: 1rem;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #333;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #357abd;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    background-color: #b0c4de;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const Dot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#4a90e2' : '#d0e1f9'};
  margin: 0 5px;
  transition: background-color 0.3s ease;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
`;

const StepTitle = styled.h3`
  font-size: 1.3rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const HowItWorks = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Container>
      <MinimizedContainer onClick={() => setIsExpanded(!isExpanded)}>
        <Title>How It Works</Title>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          ▼
        </motion.div>
      </MinimizedContainer>
      <AnimatePresence>
        {isExpanded && (
          <ExpandedContainer
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StepIndicator>
              {steps.map((_, index) => (
                <Dot key={index} active={index === currentStep} />
              ))}
            </StepIndicator>
            <StepTitle>{steps[currentStep].title}</StepTitle>
            <StepContent>
              <p>{steps[currentStep].icon} {steps[currentStep].description}</p>
            </StepContent>
            <NavigationButtons>
              <Button onClick={handlePrevious} disabled={currentStep === 0}>
                Previous
              </Button>
              <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </NavigationButtons>
          </ExpandedContainer>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default HowItWorks;