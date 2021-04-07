import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  border-radius: 12px;
  justify-content: space-evenly;
  background: #9b6cb9;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  height: 3rem;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: #000000;
  font-size: 20px;
  width: 100%;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 500;
    color: #ffffff;
    background: #7259a6;
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

export function StakeTabs({ active }: { active: 'doi' | 'doi-history' }) {
  const { t } = useTranslation()
  return (
    <Tabs style={{ width: '100%' }}>
      <StyledNavLink id={`doi-nav-link`} to={'/doi'} isActive={() => active === 'doi'}>
        {t('DOI Stake Activity')}
      </StyledNavLink>
      <StyledNavLink id={`doi-history-nav-link`} to={'/doi-history'} isActive={() => active === 'doi-history'}>
        {t('DOI Stake Ended')}
      </StyledNavLink>
    </Tabs>
  )
}
