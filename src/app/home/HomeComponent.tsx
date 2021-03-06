import React, { useEffect, useContext, useState } from 'react';
import { history } from '../../helpers';
import { connect } from 'react-redux';
import { useRouteMatch, Link, Switch, Route, Redirect } from 'react-router-dom';
import { IReduxState } from '../../reducers';
import {
  Nav,
  NavList,
  NavItem,
  Page,
  PageSidebar,
  PageHeader,
  PageHeaderTools,
  SkipToContent,
  Title,
} from '@patternfly/react-core';
import { PollingContext } from '../home/duck/context';
import {
  ClustersPage,
  StoragesPage,
  PlansPage,
  PlanDebugPage,
  LogsPage,
  TokensPage,
  WelcomePage,
} from './pages';
import RefreshRoute from '../auth/RefreshRoute';
import { ICluster } from '../cluster/duck/types';
import PageHeaderComponent from '../common/components/PageHeaderComponent';
import ActiveNamespaceModal from '../common/components/ActiveNamespaceModal';
import { getActiveNamespaceFromStorage } from '../common/helpers';
import { NON_ADMIN_ENABLED } from '../../TEMPORARY_GLOBAL_FLAGS';

const mainContainerId = 'mig-ui-page-main-container';

const NavItemLink: React.FunctionComponent<{ to: string; label: string }> = ({ to, label }) => {
  const match = useRouteMatch({ path: to });
  return (
    <NavItem isActive={!!match}>
      <Link to={to}>{label}</Link>
    </NavItem>
  );
};

interface IHomeComponentProps {
  clusterList: ICluster[];
  isHideWelcomeScreen: boolean;
  activeNamespace: string;
}

const HomeComponent: React.FunctionComponent<IHomeComponentProps> = ({
  clusterList,
  isHideWelcomeScreen,
}: IHomeComponentProps) => {
  const pollingContext = useContext(PollingContext);
  useEffect(() => {
    pollingContext.startAllDefaultPolling();
  }, []);

  const nav = (
    <Nav aria-label="Page navigation" theme="dark">
      <NavList>
        <NavItemLink to="/clusters" label="Clusters" />
        <NavItemLink to="/storages" label="Replication repositories" />
        <NavItemLink to="/plans" label="Migration plans" />
        {NON_ADMIN_ENABLED && <NavItemLink to="/tokens" label="Tokens" />}
      </NavList>
    </Nav>
  );

  const isWelcomeScreen = !!useRouteMatch('/welcome');
  const isDebugScreen = !!useRouteMatch('/plans/:planName/debug');
  const isNavEnabled = !isWelcomeScreen && !isDebugScreen;

  const activeNamespace = getActiveNamespaceFromStorage();
  const [namespaceSelectIsOpen, setNamespaceSelectIsOpen] = useState(false);

  const Header = (
    <PageHeaderComponent
      showNavToggle={isNavEnabled}
      openNamespaceSelect={() => setNamespaceSelectIsOpen(true)}
      isWelcomeScreen={isWelcomeScreen}
    />
  );

  return (
    <Page
      header={Header}
      sidebar={<PageSidebar nav={nav} isNavOpen={isNavEnabled} theme="dark" />}
      isManagedSidebar={isNavEnabled}
      skipToContent={<SkipToContent href={`#${mainContainerId}`}>Skip to content</SkipToContent>}
      mainContainerId={mainContainerId}
    >
      {NON_ADMIN_ENABLED && (
        <ActiveNamespaceModal
          isOpen={namespaceSelectIsOpen}
          onClose={() => setNamespaceSelectIsOpen(false)}
        />
      )}

      <Switch>
        <Route exact path="/">
          {NON_ADMIN_ENABLED && (!isHideWelcomeScreen || !activeNamespace) ? (
            <Redirect to="/welcome" />
          ) : (
            <Redirect to="/clusters" />
          )}
        </Route>
        {NON_ADMIN_ENABLED && (
          <Route exact path="/welcome">
            <WelcomePage openNamespaceSelect={() => setNamespaceSelectIsOpen(true)} />
          </Route>
        )}
        <Route path="*">
          {activeNamespace || !NON_ADMIN_ENABLED ? (
            // Don't render any route other than /welcome until the user selects a namespace
            <Switch>
              <Route exact path="/clusters">
                <ClustersPage />
              </Route>
              <Route exact path="/storages">
                <StoragesPage />
              </Route>
              <Route exact path="/plans">
                <PlansPage />
              </Route>
              <Route exact path="/plans/:planName/debug">
                <PlanDebugPage />
              </Route>
              <RefreshRoute
                exact
                path="/logs/:planId"
                clusterList={clusterList}
                isLoggedIn
                component={LogsPage}
              />
              {NON_ADMIN_ENABLED && (
                <Route exact path="/tokens">
                  <TokensPage />
                </Route>
              )}
              <Route path="*">
                <Redirect to="/" />
              </Route>
            </Switch>
          ) : (
            <Redirect to="/" />
          )}
        </Route>
      </Switch>
    </Page>
  );
};

const mapStateToProps = (state: IReduxState) => ({
  isHideWelcomeScreen: state.auth.isHideWelcomeScreen,
});

export default connect(mapStateToProps, (dispatch) => ({
  onLogout: () => console.debug('TODO: IMPLEMENT: user logged out.'),
}))(HomeComponent);
