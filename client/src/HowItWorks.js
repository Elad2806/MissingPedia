import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlayCircle, FaChevronDown, FaChevronUp, FaArrowRight, FaLightbulb, FaSearch, FaPencilAlt, FaBookmark } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

const Container = styled.div`
  max-width: 800px;
  margin: 0.6rem auto; 
  padding: 0.5rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const CompactWelcomeSection = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #f8f9fa 0%, #f0f0f0 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const WelcomeText = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  color: #1a73e8;
  font-weight: 500;
  width: 100%;
  padding: 0.5rem;
  font-size: 0.95rem;

  svg {
    font-size: 1.2rem;
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: translateX(3px);
  }
`;

const CompactTourButton = styled(motion.button)`
  background: linear-gradient(45deg, #1a73e8, #4285f4);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(26, 115, 232, 0.2);

  &:hover {
    background: linear-gradient(45deg, #1557b0, #1a73e8);
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
    transform: translateY(-1px);
  }

  svg {
    font-size: 1.2rem;
  }
`;

const WelcomeSection = styled(motion.div)`
  position: relative; // Add this to contain absolute positioned children
  text-align: center;
  margin-bottom: 1rem;
  padding: 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #1a73e8;
  margin-bottom: 1rem;
  margin-top: -1rem; // Added this line to move title up
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #5f6368;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const FeatureCard = styled(motion.div)`
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  svg {
    font-size: 2rem;
    color: #1a73e8;
    margin-bottom: 1rem;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.2rem;
  color: #202124;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const FeatureDescription = styled.p`
  color: #5f6368;
  line-height: 1.4;
  font-size: 0.95rem;
`;

const TourButton = styled(motion.button)`
  width: 100%;
  background: linear-gradient(45deg, #1a73e8, #4285f4);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1.2rem;
  font-size: 1.2rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);

  &:hover {
    background: linear-gradient(45deg, #1557b0, #1a73e8);
    box-shadow: 0 6px 16px rgba(26, 115, 232, 0.3);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(1px);
  }

  svg {
    font-size: 1.4rem;
  }
`;

const CollapseButton = styled(motion.button)`
  position: absolute;
  top: 1rem;
  right: 0rem; // Changed from 1rem to 1.5rem to move left
  background: none;
  border: none;
  color: #666;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  z-index: 1; // Ensure button stays above content

  &:hover {
    color: #333;
  }
`;

const ContentWrapper = styled(motion.div)`
  position: relative;
  padding-top: ${props => props.isExpanded ? '2rem' : '0'};
`;

const features = [
  {
    icon: <FaLightbulb />,
    title: "Smart Discovery",
    description: "Find Wikipedia articles that need your expertise using our intelligent category matching system."
  },
  {
    icon: <FaSearch />,
    title: "Tailored Suggestions",
    description: "Get personalized article suggestions based on your Wikipedia edit history or topics you care about."
  },
  {
    icon: <FaPencilAlt />,
    title: "Language Bridge",
    description: "Identify articles that need to be expanded or created in different languages, helping bridge knowledge gaps across Wikipedia."
  },
  {
    icon: <FaBookmark />,
    title: "Watchlist Integration",
    description: "Easily track articles of interest by adding them to your Wikipedia watchlist directly from MissingPedia."
  }
];

const HowItWorks = ({ startTour, isLoggedIn }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(!isLoggedIn);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    setIsExpanded(!isLoggedIn);
    setIsCompact(false);
  }, [isLoggedIn]);

  if (!isVisible) return null;

  if (isLoggedIn || isCompact) {
    return (
      <Container>
        <CompactWelcomeSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          onClick={startTour}
        >
          <WelcomeText>
            <FaLightbulb />
            New to MissingPedia? Take a quick tour of the features
            <FaPlayCircle style={{ marginLeft: 'auto' }} />
          </WelcomeText>
        </CompactWelcomeSection>
      </Container>
    );
  }

  return (
    <Container>
      <WelcomeSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ContentWrapper isExpanded={isExpanded}>
          <CollapseButton onClick={() => isExpanded ? setIsCompact(true) : setIsExpanded(true)}>
            {isExpanded ? (
              <IoClose size={20} />
            ) : (
              <>
                <FaChevronDown />
                Show Welcome
              </>
            )}
          </CollapseButton>

          <AnimatePresence>
            {isExpanded ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Title>Welcome to MissingPedia</Title>
                <Subtitle>
                  Your gateway to meaningful Wikipedia contributions. Find articles that match your expertise
                  and help make knowledge accessible to everyone.
                </Subtitle>
                
                <FeatureGrid>
                  {features.map((feature, index) => (
                    <FeatureCard
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                    >
                      {feature.icon}
                      <FeatureTitle>{feature.title}</FeatureTitle>
                      <FeatureDescription>{feature.description}</FeatureDescription>
                    </FeatureCard>
                  ))}
                </FeatureGrid>

                <TourButton
                  onClick={startTour}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaPlayCircle />
                  Take an Interactive Tour
                </TourButton>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  padding: '0.5rem'
                }}
              >
                <TourButton
                  onClick={startTour}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: 'auto', padding: '0.5rem 1rem' }}
                >
                  <FaPlayCircle />
                  Quick Tour
                </TourButton>
              </motion.div>
            )}
          </AnimatePresence>
        </ContentWrapper>
      </WelcomeSection>
    </Container>
  );
};

export default HowItWorks;