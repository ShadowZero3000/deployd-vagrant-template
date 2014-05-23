Exec { path => [ "/bin/", "/sbin/" , "/usr/bin/", "/usr/sbin/" ] }
File { owner => 0, group => 0, mode => 0644 }

/* If you have dependencies on a local gitlab, you probably need something like this
host { 'gitlab.localdomain':
    ip => '192.168.56.7',
    host_aliases => [ 'gitlab.localdomain' ],
    before => [Exec['install_app_dependencies']],
}
exec { 'No SSL verification':
  command => 'npm config set strict-ssl false',
  environment => "HOME=/root",
  user => "root",
  require => [File['/usr/bin/npm']],
  before => [Exec['install_app_dependencies']],
}
*/
class {'::mongodb::server':
  port    => 27018,
  verbose => true,
}
class {'nodejs':
  version => 'stable',
  make_install => false,
}
package { 'g++':
  ensure => 'installed'
}

user { 'node':
  ensure => 'present',
}

file { '/opt/node_modules':
  ensure => 'directory',
  owner => 'node',
  require => [User['node']],
}

file { '/opt/node':
  ensure => 'link',
  target => '/vagrant/node'
}

file { '/opt/node/node_modules':
  ensure => 'link',
  target => '/opt/node_modules',
  require => [File['/opt/node_modules']],
}
file { '/opt/node_modules/apidocs.js':
  ensure => 'link',
  target => '/vagrant/node/additional_modules/apidocs.js',
  require => [File['/opt/node_modules']],
}

file { '/usr/bin/node':
  ensure => 'link',
  target => '/usr/local/node/node-default/bin/node',
  require => [Class['nodejs']],
}

file { '/usr/bin/npm':
  ensure => 'link',
  target => '/usr/local/node/node-default/bin/npm',
  require => [Class['nodejs']],
}

exec { 'install_app_dependencies':
	command => 'npm install --unsafe-perm',
	cwd => '/opt/node',
	require => [Class['nodejs'],File['/opt/node'],Package['g++'],File['/usr/bin/npm'],File['/opt/node_modules/apidocs.js']],
	user => 'root',
  environment => "HOME=/root",
}
include upstart

upstart::job { 'node_app':
  description	=> "The node application",
  respawn		=> true,
  user			=> 'node',
  group			=> 'node',
  chdir			=> '/opt/node',
  exec			=> 'node app.js',
  require		=> [User['node'],File['/opt/node'],Class['nodejs'],Exec['install_app_dependencies']],
}

class { 'haproxy': }
haproxy::listen { 'node_app':
  ipaddress => ' ',
  ports     => '80',
  mode      => 'http',
  options   => {
    'balance' => 'roundrobin',
    'cookie' => 'nodeClientID insert indirect',
  }
}
haproxy::balancermember { 'node_app_hosts':
  listening_service => 'node_app',
  ports             => '80',
  server_names      => ['node1', 'node2'],
  ipaddresses       => ['127.0.0.1:3001', '127.0.0.1:3002'],
  options           => 'check',
  define_cookies    => true,
}